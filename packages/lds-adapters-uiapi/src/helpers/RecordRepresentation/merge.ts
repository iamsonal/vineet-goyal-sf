import { Luvio, IngestPath, StoreRecordError } from '@luvio/engine';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
    keyBuilder as recordRepKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import { buildNetworkSnapshot as getRecordFieldsNetwork } from '../../wire/getRecord/GetRecordFields';
import {
    isGraphNode,
    isSupportedEntity,
    extractTrackedFieldsToTrie,
    RecordFieldTrie,
    convertTrieToFields,
    isSuperRecordFieldTrie,
    TrackedFieldsConfig,
} from '../../util/records';
import { ObjectKeys } from '../../util/language';
import { RecordConflictMap } from './resolveConflict';
import { configuration } from '../../configuration';

const INCOMING_WEAKETAG_0_KEY = 'incoming-weaketag-0';
const EXISTING_WEAKETAG_0_KEY = 'existing-weaketag-0';
const RECORD_API_NAME_CHANGE_EVENT = 'record-api-name-change-event';

// This function sets fields that we are refreshing to pending
// These values will go into the store
function mergePendingFields(
    newRecord: RecordRepresentationNormalized,
    oldRecord: RecordRepresentationNormalized
): RecordRepresentationNormalized {
    // TODO [W-6900046]: avoid casting to any by updating
    // RecordRepresentationNormalized['fields'] to include `pending:true` property
    const mergedFields = { ...newRecord.fields } as any;
    const merged = { ...newRecord, fields: mergedFields };

    const existingFields = ObjectKeys(oldRecord.fields);
    for (let i = 0, len = existingFields.length; i < len; i += 1) {
        const spanningFieldName = existingFields[i];

        if (newRecord.fields[spanningFieldName] === undefined) {
            // TODO [W-6900046]: fix above casting issue so we're not stuffing arbitrary things
            // into RecordRepresentationNormalized['fields']
            mergedFields[spanningFieldName] = {
                __ref: undefined,
                pending: true,
            };
        }
    }

    return merged;
}

// This method gets called
// when incoming record has a higher version
// than the record that is currently in the store
function mergeAndRefreshHigherVersionRecord(
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized,
    incomingTrackedFieldsTrieRoot: RecordFieldTrie,
    existingTrackedFieldsTrieRoot: RecordFieldTrie,
    recordConflictMap: RecordConflictMap
): RecordRepresentationNormalized {
    // If the higher version (incoming) does not contain a superset of fields as existing
    // then we need to refresh to get updated versions of fields in existing
    if (
        isSuperRecordFieldTrie(incomingTrackedFieldsTrieRoot, existingTrackedFieldsTrieRoot) ===
        false
    ) {
        // If this is an unsupported entity, do NOT attempt to go to the network
        // Simply merge what we have and move on
        if (isSupportedEntity(incoming.apiName) === false) {
            return mergeRecordFields(incoming, existing);
        }
        // update the conflict map to resolve the record conflict in resolveConflict
        recordConflictMap.conflicts[incoming.id] = {
            recordId: incoming.id,
            trackedFields: existingTrackedFieldsTrieRoot,
        };

        // We want to mark fields in the store as pending
        // Because we don't want to emit any data to components
        return mergePendingFields(incoming, existing);
    }

    return incoming;
}

// This method gets called
// when incoming record has a lower version
// than the record that is currently in the store
function mergeAndRefreshLowerVersionRecord(
    luvio: Luvio,
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized,
    incomingTrackedFieldsTrieRoot: RecordFieldTrie,
    existingTrackedFieldsTrieRoot: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): RecordRepresentationNormalized {
    // If the higher version (existing) does not have a superset of fields as incoming
    // then we need to refresh to get updated versions of fields on incoming
    if (
        isSuperRecordFieldTrie(existingTrackedFieldsTrieRoot, incomingTrackedFieldsTrieRoot) ===
        false
    ) {
        // If this is an unsupported entity, do NOT attempt to go to the network
        // Simply merge what we have and move on
        if (isSupportedEntity(incoming.apiName) === false) {
            return mergeRecordFields(existing, incoming);
        }

        const merged = mergePendingFields(existing, incoming);

        // update the conflict map to resolve the record conflict in resolveConflict
        if (recordConflictMap) {
            recordConflictMap.conflicts[incoming.id] = {
                recordId: incoming.id,
                trackedFields: incomingTrackedFieldsTrieRoot,
            };
        } else {
            getRecordFieldsNetwork(luvio, {
                recordId: incoming.id,
                optionalFields: convertTrieToFields(incomingTrackedFieldsTrieRoot),
            });
        }

        return merged;
    }

    return existing;
}

function mergeRecordConflict(
    luvio: Luvio,
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized,
    recordConflictMap: RecordConflictMap
) {
    const incomingNode =
        luvio.wrapNormalizedGraphNode<RecordRepresentationNormalized, RecordRepresentation>(
            incoming
        );
    const existingNode =
        luvio.wrapNormalizedGraphNode<RecordRepresentationNormalized, RecordRepresentation>(
            existing
        );
    const incomingTrackedFieldsTrieRoot = {
        name: incoming.apiName,
        children: {},
    };
    const existingTrackedFieldsTrieRoot = {
        name: existing.apiName,
        children: {},
    };

    const recordKey = recordRepKeyBuilder({
        recordId: incoming.id,
    });

    const trackedFieldsConfig: TrackedFieldsConfig = {
        maxDepth: configuration.getTrackedFieldDepthOnCacheMergeConflict(),
        onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
    };
    extractTrackedFieldsToTrie(
        recordKey,
        incomingNode,
        incomingTrackedFieldsTrieRoot,
        trackedFieldsConfig
    );
    extractTrackedFieldsToTrie(
        recordKey,
        existingNode,
        existingTrackedFieldsTrieRoot,
        trackedFieldsConfig
    );

    if (incoming.weakEtag > existing.weakEtag) {
        return mergeAndRefreshHigherVersionRecord(
            incoming,
            existing,
            incomingTrackedFieldsTrieRoot,
            existingTrackedFieldsTrieRoot,
            recordConflictMap
        );
    }

    return mergeAndRefreshLowerVersionRecord(
        luvio,
        incoming,
        existing,
        incomingTrackedFieldsTrieRoot,
        existingTrackedFieldsTrieRoot,
        recordConflictMap
    );
}

function getNotNull(recordAValue: string | null, recordBValue: string | null): string | null {
    return recordAValue === null ? recordBValue : recordAValue;
}

function mergeRecordFields(
    recordA: RecordRepresentationNormalized,
    recordB: RecordRepresentationNormalized
): RecordRepresentationNormalized {
    const lastModifiedDate = getNotNull(recordA.lastModifiedDate, recordB.lastModifiedDate);
    const lastModifiedById = getNotNull(recordA.lastModifiedById, recordB.lastModifiedById);
    const systemModstamp = getNotNull(recordA.systemModstamp, recordB.systemModstamp);
    return {
        ...recordA,
        fields: {
            ...recordB.fields,
            ...recordA.fields,
        },
        lastModifiedDate,
        lastModifiedById,
        systemModstamp,
    };
}

function isErrorEntry(
    entry: RecordRepresentationNormalized | StoreRecordError
): entry is StoreRecordError {
    return (entry as StoreRecordError).__type === 'error';
}

export default function merge(
    existing: RecordRepresentationNormalized | undefined | StoreRecordError,
    incoming: RecordRepresentationNormalized,
    luvio: Luvio,
    _path: IngestPath,
    recordConflictMap: RecordConflictMap
): RecordRepresentationNormalized {
    if (existing === undefined || isErrorEntry(existing)) {
        return incoming;
    }
    // recordTypeId may get changed based on record state.
    // Evicts all dependencies from store.
    if (incoming.recordTypeId !== existing.recordTypeId) {
        const recordDepKey = dependencyKeyBuilder({ recordId: existing.id });
        const node = luvio.getNode<{ [key: string]: true }, any>(recordDepKey);
        if (isGraphNode(node)) {
            const dependencies = node.retrieve();
            if (dependencies !== null) {
                const depKeys = ObjectKeys(dependencies);
                for (let i = 0, len = depKeys.length; i < len; i++) {
                    luvio.storeEvict(depKeys[i]);
                }
            }
        }
    }

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO - handle merging of records that change apiName
    // if (existing.apiName !== incoming.apiName) {
    //     if (process.env.NODE_ENV === 'production') {
    //         lds.log(`API Name changed from ${existing.apiName} to ${incoming.apiName}`);
    //     } else {
    //         throw new Error('API Name cannot be different for merging records.');
    //     }
    // }
    // Adding instrumentation to see how frequently this occurs
    if (existing.apiName !== incoming.apiName) {
        const paramsBuilder = () => {
            return {
                [RECORD_API_NAME_CHANGE_EVENT]: true,
                existingApiName: existing.apiName,
                incomingApiName: incoming.apiName,
            };
        };
        luvio.instrument(paramsBuilder);
    }

    const incomingWeakEtag = incoming.weakEtag;
    const existingWeakEtag = existing.weakEtag;

    if (incomingWeakEtag === 0 || existingWeakEtag === 0) {
        const paramsBuilder = () => {
            return {
                [INCOMING_WEAKETAG_0_KEY]: incomingWeakEtag === 0,
                [EXISTING_WEAKETAG_0_KEY]: existingWeakEtag === 0,
                apiName: incoming.apiName,
            };
        };

        luvio.instrument(paramsBuilder);
    }

    // TODO [W-6900085]: UIAPI returns weakEtag=0 when the record is >2 levels nested. For now
    // we treat the record as mergeable.
    if (incomingWeakEtag !== 0 && existingWeakEtag !== 0 && incomingWeakEtag !== existingWeakEtag) {
        return mergeRecordConflict(luvio, incoming, existing, recordConflictMap);
    }

    return mergeRecordFields(incoming, existing);
}

export function dependencyKeyBuilder(config: {
    /** The ID of this record. */
    recordId: string;
}) {
    return `UiApi::RecordRepresentationDependency:${config.recordId}`;
}
