import { StoreLink, Store } from '@ldsjs/engine';
import {
    DefaultDurableSegment,
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    OnDurableStoreChangedListener,
} from '@ldsjs/environments';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
    keyBuilderRecord,
    FieldValueRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { DraftAction, DraftActionMap, DraftQueue } from './DraftQueue';
import { ObjectCreate, ObjectKeys, ObjectAssign, ArrayPrototypeShift } from './utils/language';
import {
    buildSyntheticRecordRepresentation,
    DraftRecordRepresentationNormalized,
    isDraftId,
    isDraftRecordRepresentationNormalized,
    replayDraftsOnRecord,
    DurableRecordRepresentation,
    DURABLE_STORE_SEGMENT_DRAFT_ACTIONS,
    extractRecordKeyFromDraftDurableStoreKey,
} from './utils/records';
import {
    isStoreKeyRecordId,
    extractRecordIdFromStoreKey,
    buildRecordFieldStoreKey,
} from '@salesforce/lds-uiapi-record-utils';

/**
 * This method denormalizes field links so that a record can be looked up with all its fields in one
 * durable store read.
 *
 * It also reverts any existing draft field values applied to the record, this ensures that no draft
 * data makes its way into the durable store
 *
 * @param record Record containing normalized field links
 * @param store
 */
function denormalizeRecordFields(
    entry: DurableStoreEntry<RecordRepresentationNormalized | DraftRecordRepresentationNormalized>,
    store: Store
): DurableStoreEntry | undefined {
    const record = entry.data;

    const fields = record.fields;
    const filteredFields: {
        [key: string]: FieldValueRepresentation;
    } = {};
    const links: {
        [key: string]: StoreLink;
    } = {};
    const fieldNames = ObjectKeys(fields);
    const { records } = store;
    let drafts;
    if (isDraftRecordRepresentationNormalized(record)) {
        drafts = record.drafts;
    }
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        // pending fields get filtered out of the durable store
        // only pick up fields that contain references (i.e. they are not missing)
        const { pending, __ref } = field;
        if (pending !== true && __ref !== undefined) {
            let ref = records[__ref];
            // there is a dangling field reference, do not persist a
            // record if there's a field reference missing
            if (ref === undefined) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('failed to find normalized field reference');
                }
                return undefined;
            }

            // write back original field values so that draft values
            // do not make their way into the durable store
            if (drafts !== undefined) {
                const originalField = drafts.serverValues[fieldName];
                if (originalField !== undefined) {
                    ref = originalField;
                }
            }

            filteredFields[fieldName] = ref;
            links[fieldName] = field;
        }
    }

    return {
        expiration: entry.expiration,
        data: { ...record, fields: filteredFields, drafts: undefined, links },
    };
}

/**
 * Normalizes record fields coming out of the DurableStore into StoreLinks
 *
 * It also replays any drafts for the supplied record so that the record coming out
 * of the durable store boundary has draft values applied to it.
 * @param key
 * @param record
 */
function normalizeRecordFields(
    key: string,
    entry: DurableStoreEntry<DurableRecordRepresentation>,
    drafts: DraftAction<RecordRepresentation>[]
): DurableStoreEntries {
    const record = replayDraftsOnRecord(entry.data, drafts);
    const { fields, links } = record;

    const fieldNames = ObjectKeys(fields);
    const normalizedFields: {
        [key: string]: StoreLink<unknown>;
    } = {};
    const returnEntries: DurableStoreEntries = {};

    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];
        const link = links[fieldName];
        const fieldKey = buildRecordFieldStoreKey(key, fieldName);
        returnEntries[fieldKey] = { data: field };
        normalizedFields[fieldName] = link;
    }
    returnEntries[key] = {
        data: ObjectAssign(record, { fields: normalizedFields }),
        expiration: entry.expiration,
    };
    return returnEntries;
}

/**
 * Creates a synthetic record out of the information contained in a DraftAction
 * Note that the passed in DraftAction's method must be 'post'
 *
 * @param {DraftAction<RecordRepresentation>} draft
 * @returns {DurableStoreEntry<DurableRecordRepresentation>}
 */
function createSyntheticRecord(
    draft: DraftAction<RecordRepresentation>
): DurableStoreEntry<DurableRecordRepresentation> | undefined {
    const { body, method } = draft.request;

    if (method !== 'post') {
        if (process.env.NODE_ENV !== 'production') {
            throw Error('action must be post action to build a synthetic record');
        }
        return undefined;
    }

    const { apiName, fields } = body;

    if (apiName === undefined || fields === undefined) {
        if (process.env.NODE_ENV !== 'production') {
            throw Error('request body missing required fields');
        }
        return undefined;
    }

    const draftKey = draft.tag;
    const draftId = extractRecordIdFromStoreKey(draftKey);
    if (draftId === undefined) {
        if (process.env.NODE_ENV !== 'production') {
            throw Error('draft tag is not a record store key');
        }
        return undefined;
    }
    const draftRecord = buildSyntheticRecordRepresentation(draftId, apiName, fields);

    const links: { [key: string]: StoreLink } = {};
    const keys = ObjectKeys(fields);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        links[key] = {
            __ref: buildRecordFieldStoreKey(draftKey, key),
        };
    }

    return {
        data: {
            ...draftRecord,
            childRelationships: {},
            drafts: {
                created: true,
                edited: false,
                deleted: false,
                serverValues: {},
            },
            links,
        },
    };
}

function getRecordEntriesWithDraftOverlays(
    durableEntries: DurableStoreEntries,
    draftActionMap: DraftActionMap
) {
    const returnEntries: DurableStoreEntries = ObjectCreate(null);
    const keys = ObjectKeys(durableEntries);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = durableEntries[key];
        const drafts = (draftActionMap[key] as Readonly<DraftAction<RecordRepresentation>[]>) || [];

        if (isStoreKeyRecordId(key)) {
            ObjectAssign(
                returnEntries,
                normalizeRecordFields(
                    key,
                    value as DurableStoreEntry<DurableRecordRepresentation>,
                    [...drafts]
                )
            );
        } else {
            if (value === undefined) {
                return undefined;
            }
            returnEntries[key] = value;
        }
    }
    return returnEntries;
}

function getSyntheticRecordEntries(draftRecordKeys: string[], draftActionMap: DraftActionMap) {
    const returnEntries: DurableStoreEntries = ObjectCreate(null);
    for (let i = 0, len = draftRecordKeys.length; i < len; i++) {
        const draftKey = draftRecordKeys[i];
        const drafts = [...draftActionMap[draftKey]] as DraftAction<RecordRepresentation>[];
        if (drafts.length === 0) {
            // a draft id was requested but there are no drafts associated with it
            return undefined;
        }

        // get item at front of the queue
        const postDraft = ArrayPrototypeShift.call(drafts);
        if (postDraft === undefined) {
            return undefined;
        }
        const record = createSyntheticRecord(postDraft);
        if (record === undefined) {
            // we failed to create a synthetic record likely due to a corrupt DraftAction
            // return undefined for the entire request
            return undefined;
        }
        ObjectAssign(returnEntries, normalizeRecordFields(draftKey, record, drafts));
    }
    return returnEntries;
}

export function makeDurableStoreDraftAware(
    durableStore: DurableStore,
    draftQueue: DraftQueue,
    store: Store
): DurableStore {
    // overrides getEntries to check if any of the requested entries is a record or a record field
    // since we are storing record fields denormalized in the durable store, we will request the record
    // and normalize the fields as it comes out of the durable store.
    // Before normalizing the fields, we will query the draft queue to determine if the record has any pending
    // draft actions. If so we will apply the drafts to the denormalized record prior to normalizing into StoreLinks
    const getEntries: typeof durableStore['getEntries'] = function(
        entries: string[]
    ): Promise<DurableStoreEntries | undefined> {
        const { length: entriesLength } = entries;
        if (entriesLength === 0) {
            return Promise.resolve({});
        }

        // filtered list of entry ids that exludes draft-created records
        const filteredEntryIds: string[] = [];
        // all requested entry keys that are records
        const allRecordKeys: { [key: string]: true } = {};
        // filtered list of entry ids that are draft-created records
        const draftRecordKeys: string[] = [];
        // map of records to avoid requesting duplicate record keys when requesting both records and fields
        const recordEntries: { [key: string]: true } = {};

        for (let i = 0, len = entriesLength; i < len; i++) {
            const id = entries[i];
            const recordId = extractRecordIdFromStoreKey(id);

            if (recordId !== undefined) {
                if (recordEntries[recordId] === undefined) {
                    const key = keyBuilderRecord({ recordId });
                    recordEntries[recordId] = allRecordKeys[key] = true;
                    // don't request draft created ids from the durable store since they do not
                    // exist in the durable store
                    if (isDraftId(recordId)) {
                        draftRecordKeys.push(key);
                    } else {
                        filteredEntryIds.push(key);
                    }
                }
            } else {
                filteredEntryIds.push(id);
            }
        }

        return durableStore
            .getEntries(filteredEntryIds, DefaultDurableSegment)
            .then((durableEntries: DurableStoreEntries | undefined) => {
                if (durableEntries === undefined && filteredEntryIds.length > 0) {
                    return undefined;
                }

                return draftQueue.getActionsForTags(allRecordKeys).then(draftActionMap => {
                    const returnEntries: DurableStoreEntries = ObjectCreate(null);
                    if (durableEntries !== undefined) {
                        const existingEntriesWithDrafts = getRecordEntriesWithDraftOverlays(
                            durableEntries,
                            draftActionMap
                        );
                        ObjectAssign(returnEntries, existingEntriesWithDrafts);
                    }

                    // include synthetic draft-created records in returnEntries if any requested ids are draft ids
                    if (draftRecordKeys.length > 0) {
                        const syntheticRecordEntries = getSyntheticRecordEntries(
                            draftRecordKeys,
                            draftActionMap
                        );
                        ObjectAssign(returnEntries, syntheticRecordEntries);
                    }

                    return returnEntries;
                });
            });
    };

    // overrides setEntries to determine if any of the entries being set is a record or a record field
    // if an entry is a record or record field, we store the entire record with its fields denormalized
    // if the record has any draft fields applied to it, we restore the original field value to the record
    // prior to putting it to ensure that no draft data enters the DurableStore
    const setEntries: typeof durableStore['setEntries'] = function(
        entries: DurableStoreEntries
    ): Promise<void> {
        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        const putRecords: { [key: string]: boolean } = {};
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            let value = entries[key];

            const recordId = extractRecordIdFromStoreKey(key);
            // do not put normalized field values
            if (recordId !== undefined) {
                const recordKey = keyBuilderRecord({ recordId });
                if (putRecords[recordId] === true) {
                    continue;
                }
                const record = store.records[recordKey];

                if (isDraftId(record.id)) {
                    // don't put draft created items to durable store
                    continue;
                }

                putRecords[recordId] = true;
                const denormalizedValue = denormalizeRecordFields(
                    {
                        expiration: store.recordExpirations[recordKey],
                        data: record,
                    },
                    store
                );
                if (denormalizedValue !== undefined) {
                    putEntries[recordKey] = denormalizedValue;
                }
            } else {
                putEntries[key] = value;
            }
        }

        return durableStore.setEntries(putEntries, DefaultDurableSegment);
    };

    /**
     * Intercepts durable store changes to determine if a change to a draft action was made.
     * If a DraftAction changes, we need to evict the affected record from the in memory store
     * So it rebuilds with the new draft action applied to it
     */
    const registerOnChangeListener: typeof durableStore['registerOnChangedListener'] = function(
        listener: OnDurableStoreChangedListener
    ) {
        durableStore.registerOnChangedListener(
            (ids: { [key: string]: boolean }, segment: string) => {
                if (segment !== DURABLE_STORE_SEGMENT_DRAFT_ACTIONS) {
                    return listener(ids, segment);
                }
                const keys = ObjectKeys(ids);
                const changedIds: { [key: string]: true } = {};
                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    const recordKey = extractRecordKeyFromDraftDurableStoreKey(key);
                    if (recordKey !== undefined) {
                        changedIds[recordKey] = true;
                    } else {
                        changedIds[key] = true;
                    }
                }
                return listener(changedIds, segment);
            }
        );
    };

    return ObjectCreate(durableStore, {
        getEntries: { value: getEntries },
        setEntries: { value: setEntries },
        registerOnChangedListener: { value: registerOnChangeListener },
    });
}
