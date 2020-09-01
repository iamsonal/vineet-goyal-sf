import { LDS, ProxyGraphNode, GraphNode } from '@ldsjs/engine';
import {
    ingestRecord,
    keyBuilderRecord,
    keyBuilderObjectInfo,
    RecordRepresentation,
    RecordRepresentationNormalized,
    ObjectInfoRepresentation,
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';

import {
    ArrayPrototypePush,
    JSONParse,
    JSONStringify,
    ObjectKeys,
    ObjectPrototypeHasOwnProperty,
} from './utils/language';

import { timer } from 'instrumentation/service';
import { timerMetricAddDuration } from '@salesforce/lds-instrumentation';
import {
    ADS_BRIDGE_ADD_RECORDS_DURATION,
    ADS_BRIDGE_EMIT_RECORD_CHANGED_DURATION,
    ADS_BRIDGE_EVICT_DURATION,
} from './utils/metric-keys';

// No need to pass the actual record key `lds.ingestStore`. The `RecordRepresentation.ts#ingest`
// function extracts the appropriate record id from the ingested record.
const INGEST_KEY = '';

const RECORD_ID_PREFIX = 'UiApi::RecordRepresentation:';
const RECORD_ID_REGEXP = /^UiApi::RecordRepresentation:([a-zA-Z0-9])+$/;

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

type Unsubscribe = () => void;

interface AdsRecord {
    /**
     * True if the passed record is a primary record, otherwise false.
     *
     * The Salesforce APIs may represent different records with the same record id. All the
     * records returned by the UI API are primary records.
     */
    isPrimary: boolean;

    /** The actual record data */
    record: RecordRepresentation;
}

interface AdsRecordMap {
    [recordId: string]: {
        [objectApiName: string]: AdsRecord;
    };
}

interface ObjectMetadata {
    /**
     * The entity key prefix.
     * This originally was typed as simply a "string",
     * however, "keyPrefix" can be null on ObjectInfoRepresentation
     * and existing behavior simply passes ObjectInfoRepresentation.keyPrefix
     * straight to ADS. This type has been updated to capture that
     * a string or null can be passed here.
     * */

    _keyPrefix: string | null;

    /** The entity field name. */
    _nameField: string;

    /** The entity label. */
    _entityLabel: string;
}

interface AdsObjectMetadataMap {
    [objectApiName: string]: ObjectMetadata;
}

type LdsRecordChangedCallback = (record: AdsRecordMap, objectMetadata: AdsObjectMetadataMap) => any;

function isGraphNode<T, U>(node: ProxyGraphNode<T, U>): node is GraphNode<T, U> {
    return node !== null && node.type === 'Node';
}

function isSpanningRecord(
    fieldValue: null | string | number | boolean | RecordRepresentation
): fieldValue is RecordRepresentation {
    return fieldValue !== null && typeof fieldValue === 'object';
}

/**
 * Returns a shallow copy of a record with its field values if it is a scalar and a reference and a
 * a RecordRepresentation with no field if the value if a spanning record.
 * It returns null if the record contains any pending field.
 */
function getShallowRecord(lds: LDS, storeRecordId: string): RecordRepresentation | null {
    const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(
        storeRecordId
    );

    if (!isGraphNode(recordNode)) {
        return null;
    }

    const fieldsCopy: RecordRepresentation['fields'] = {};
    const copy: RecordRepresentation = {
        ...recordNode.retrieve(),
        fields: fieldsCopy,
        childRelationships: {},
    };

    const fieldsNode = recordNode.object('fields');
    const fieldNames = fieldsNode.keys();

    for (let i = 0, len = fieldNames.length; i < len; i++) {
        let fieldCopy: FieldValueRepresentation;

        const fieldName = fieldNames[i];
        const fieldLink = fieldsNode.link<
            FieldValueRepresentationNormalized,
            FieldValueRepresentation
        >(fieldName);
        if (fieldLink.isPending() === true) {
            return null;
        }

        const fieldNode = fieldLink.follow();
        if (!isGraphNode(fieldNode)) {
            continue;
        }

        const { displayValue, value } = fieldNode.retrieve();
        if (fieldNode.isScalar('value')) {
            fieldCopy = {
                displayValue: displayValue,
                value: value as string | number | boolean | null,
            };
        } else {
            const spanningRecordLink = fieldNode.link<
                RecordRepresentationNormalized,
                RecordRepresentation
            >('value');
            if (spanningRecordLink.isPending() === true) {
                return null;
            }

            const spanningRecordNode = spanningRecordLink.follow();
            if (!isGraphNode(spanningRecordNode)) {
                continue;
            }

            fieldCopy = {
                displayValue,
                value: {
                    ...spanningRecordNode.retrieve(),
                    fields: {},
                    childRelationships: {},
                },
            };
        }

        fieldsCopy[fieldName] = fieldCopy;
    }

    return copy;
}

/**
 * Returns the ADS object metadata representation for a specific record.
 */
function getObjectMetadata(lds: LDS, record: RecordRepresentation): ObjectMetadata {
    const { data: objectInfo } = lds.storeLookup<ObjectInfoRepresentation>({
        recordId: keyBuilderObjectInfo({ apiName: record.apiName }),
        node: {
            kind: 'Fragment',
            private: ['eTag'],
            opaque: true,
        },
        variables: {},
    });

    if (objectInfo !== undefined) {
        let nameField = 'Name';

        // Extract the entity name field from the object info. In the case where there are multiple
        // field names then pick up the first one.
        if (objectInfo.nameFields.length !== 0 && objectInfo.nameFields.indexOf('Name') === -1) {
            nameField = objectInfo.nameFields[0];
        }

        return {
            _nameField: nameField,
            _entityLabel: objectInfo.label,
            _keyPrefix: objectInfo.keyPrefix,
        };
    }

    return {
        _nameField: 'Name',
        _entityLabel: record.apiName,
        _keyPrefix: record.id.substring(0, 3),
    };
}

/**
 * RecordGvp can send records back to ADS with record types incorrectly set to the master
 * record type. Since there are no known legitimate scenarios where a record can change from a
 * non-master record type back to the master record type, we assume such a transition
 * indicates a RecordGvp mistake. This function checks for that scenario and overwrites the
 * incoming ADS record type information with what we already have in the store when it
 * occurs.
 *
 * @param lds LDS
 * @param record record from ADS, will be fixed in situ
 */
function fixRecordTypes(lds: LDS, record: RecordRepresentation): void {
    // non-master record types should always be correct
    if (record.recordTypeId === MASTER_RECORD_TYPE_ID) {
        const key = keyBuilderRecord({ recordId: record.id });
        const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(key);

        if (
            isGraphNode(recordNode) &&
            recordNode.scalar('recordTypeId') !== MASTER_RECORD_TYPE_ID
        ) {
            // ignore bogus incoming record type information & keep what we have
            record.recordTypeId = recordNode.scalar('recordTypeId');
            record.recordTypeInfo = recordNode.object('recordTypeInfo').data;
        }
    }

    // recurse on nested records
    const fieldKeys = ObjectKeys(record.fields);
    const fieldKeysLen = fieldKeys.length;
    for (let i = 0; i < fieldKeysLen; ++i) {
        const fieldValue = record.fields[fieldKeys[i]].value;
        if (isSpanningRecord(fieldValue)) {
            fixRecordTypes(lds, fieldValue);
        }
    }
}

export default class AdsBridge {
    private isRecordEmitLocked: boolean = false;
    private watchUnsubscribe: Unsubscribe | undefined;
    private addRecordsTimerMetric = timer(ADS_BRIDGE_ADD_RECORDS_DURATION);
    private evictTimerMetric = timer(ADS_BRIDGE_EVICT_DURATION);
    private emitRecordChangedTimerMetric = timer(ADS_BRIDGE_EMIT_RECORD_CHANGED_DURATION);

    constructor(private lds: LDS) {}

    /**
     * This setter invoked by recordLibrary to listen for records ingested by LDS. The passed method
     * is invoked whenever a record is ingested. It may be via getRecord, getRecordUi, getListUi, ...
     */
    public set receiveFromLdsCallback(callback: LdsRecordChangedCallback | undefined) {
        // Unsubscribe if there is an existing subscription.
        if (this.watchUnsubscribe !== undefined) {
            this.watchUnsubscribe();
            this.watchUnsubscribe = undefined;
        }

        if (callback !== undefined) {
            this.watchUnsubscribe = this.lds.storeWatch(RECORD_ID_PREFIX, entries => {
                if (this.isRecordEmitLocked === true) {
                    return;
                }

                this.emitRecordChanged(entries, callback);
            });
        }
    }

    /**
     * This method is invoked when a record has been ingested by ADS.
     *
     * ADS may invoke this method with records that are not UIAPI allowlisted so not refreshable by
     * LDS. LDS filters the provided list so it ingests only UIAPI allowlisted records.
     */
    public addRecords(
        records: RecordRepresentation[],
        uiApiEntityAllowlist?: {
            [name: string]: 'false' | undefined;
        }
    ): void {
        const startTime = Date.now();
        const { lds } = this;
        let didIngestRecord = false;
        return this.lockLdsRecordEmit(() => {
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const { apiName } = record;

                // Ingest the record if no allowlist is passed or the entity name is allowlisted.
                if (
                    uiApiEntityAllowlist === undefined ||
                    uiApiEntityAllowlist[apiName] !== 'false'
                ) {
                    didIngestRecord = true;

                    // Deep-copy the record to ingest and ingest the record copy. This avoids
                    // corrupting the ADS cache since ingestion mutates the passed record.
                    const recordCopy = JSONParse(JSONStringify(record));

                    // Don't let incorrect ADS/RecordGVP recordTypeIds replace a valid record type in our store
                    // with the master record type. See W-7302870 for details.
                    fixRecordTypes(lds, recordCopy);

                    lds.storeIngest(INGEST_KEY, ingestRecord, recordCopy);
                }
            }

            if (didIngestRecord === true) {
                lds.storeBroadcast();
            }
            timerMetricAddDuration(this.addRecordsTimerMetric, Date.now() - startTime);
        });
    }

    /**
     * This method is invoked whenever a record has been evicted from ADS.
     */
    public evict(recordId: string): Promise<void> {
        const startTime = Date.now();
        const { lds } = this;
        const key = keyBuilderRecord({ recordId });
        return this.lockLdsRecordEmit(() => {
            lds.storeEvict(key);
            lds.storeBroadcast();
            timerMetricAddDuration(this.evictTimerMetric, Date.now() - startTime);
            return Promise.resolve();
        });
    }

    /**
     * Gets the list of fields of a record that LDS has in its store. The field list doesn't
     * contains the spanning record fields. ADS uses this list when it loads a record from the
     * server. This is an optimization to make a single roundtrip it queries for all fields required
     * by ADS and LDS.
     */
    public getTrackedFieldsForRecord(recordId: string): Promise<string[]> {
        const { lds } = this;
        const storeRecordId = keyBuilderRecord({ recordId });

        const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(
            storeRecordId
        );

        if (!isGraphNode(recordNode)) {
            return Promise.resolve([]);
        }

        const apiName = recordNode.scalar('apiName');
        const fieldNames = recordNode.object('fields').keys();

        // Prefix all the fields with the record API name.
        const qualifiedFieldNames: string[] = [];
        for (let i = 0, len = fieldNames.length; i < len; i++) {
            ArrayPrototypePush.call(qualifiedFieldNames, `${apiName}.${fieldNames[i]}`);
        }

        return Promise.resolve(qualifiedFieldNames);
    }

    /**
     * Prevents the bridge to emit record change during the execution of the callback.
     * This methods should wrap all the LDS store mutation done by the bridge. It prevents LDS store
     * mutations triggered by ADS to be emit back to ADS.
     */
    private lockLdsRecordEmit<T>(callback: () => T): T {
        this.isRecordEmitLocked = true;

        try {
            return callback();
        } finally {
            this.isRecordEmitLocked = false;
        }
    }

    /**
     * This method retrieves queries the store with with passed record ids to retrieve their
     * associated records and object info. Note that the passed ids are not Salesforce record id
     * but rather LDS internals store ids.
     */
    private emitRecordChanged(
        updatedEntries: { id: string }[],
        callback: LdsRecordChangedCallback
    ): void {
        const startTime = Date.now();
        const { lds } = this;
        let shouldEmit = false;

        const adsRecordMap: AdsRecordMap = {};
        const adsObjectMap: AdsObjectMetadataMap = {};

        for (let i = 0; i < updatedEntries.length; i++) {
            const storeRecordId = updatedEntries[i].id;

            // Exclude all the store record ids not matching with the record id pattern.
            // Note: FieldValueRepresentation have the same prefix than RecordRepresentation so we
            // need to filter them out.
            if (!storeRecordId.match(RECORD_ID_REGEXP)) {
                continue;
            }

            const record = getShallowRecord(lds, storeRecordId);
            if (record === null) {
                continue;
            }

            const { id, apiName } = record;

            shouldEmit = true;
            adsRecordMap[id] = {
                [apiName]: {
                    isPrimary: true,
                    record,
                },
            };

            // Extract and add the object metadata to the map if not already present.
            if (!ObjectPrototypeHasOwnProperty.call(adsObjectMap, apiName)) {
                adsObjectMap[apiName] = getObjectMetadata(lds, record);
            }
        }

        if (shouldEmit === true) {
            callback(adsRecordMap, adsObjectMap);
        }
        timerMetricAddDuration(this.emitRecordChangedTimerMetric, Date.now() - startTime);
    }
}
