import { StoreLink, Store, RecordSource } from '@luvio/engine';
import {
    DefaultDurableSegment,
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    DurableStoreChange,
    OnDurableStoreChangedListener,
} from '@luvio/environments';
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
    isDraftRecordRepresentationNormalized,
    replayDraftsOnRecord,
    DurableRecordRepresentation,
    extractRecordKeyFromDraftDurableStoreKey,
    isStoreRecordError,
} from './utils/records';
import {
    isStoreKeyRecordId,
    extractRecordIdFromStoreKey,
    buildRecordFieldStoreKey,
} from '@salesforce/lds-uiapi-record-utils';
import { DraftIdMappingEntry } from './DraftQueue';
import { DRAFT_SEGMENT, DRAFT_ID_MAPPINGS_SEGMENT } from './DurableDraftQueue';
import { DurableStoreSetEntryPlugin } from './plugins/DurableStorePlugins';

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
    records: RecordSource,
    pendingEntries: DurableStoreEntries<
        RecordRepresentationNormalized | DraftRecordRepresentationNormalized
    >
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
    let drafts;
    if (isDraftRecordRepresentationNormalized(record)) {
        drafts = record.drafts;
    }
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        // pending fields get filtered out of the durable store
        const { pending } = field;
        if (pending !== true) {
            const { isMissing, __ref } = field;

            if (__ref !== undefined) {
                let ref = records[__ref];

                // If the ref was part of the pending write that takes precedence
                const pendingEntry = pendingEntries[__ref];
                if (pendingEntry !== undefined) {
                    ref = pendingEntry.data;
                }

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
            } else if (isMissing) {
                // persist missing links
                links[fieldName] = field;
            }
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
 * @param drafts the list of draft action to play on the record
 * @param userId The current user id, will be the last modified id
 */
function normalizeRecordFields(
    key: string,
    entry: DurableStoreEntry<DurableRecordRepresentation>,
    drafts: DraftAction<RecordRepresentation>[],
    userId: string
): DurableStoreEntries<DurableRecordRepresentation | FieldValueRepresentation> {
    const record = replayDraftsOnRecord(entry.data, drafts, userId);
    const { fields, links } = record;

    const linkNames = ObjectKeys(links);
    const normalizedFields: {
        [key: string]: StoreLink<unknown>;
    } = {};
    const returnEntries: DurableStoreEntries<
        DurableRecordRepresentation | FieldValueRepresentation
    > = {};

    for (let i = 0, len = linkNames.length; i < len; i++) {
        const fieldName = linkNames[i];
        const field = fields[fieldName];
        const link = links[fieldName];
        // field is undefined for missing links
        if (field !== undefined) {
            const fieldKey = buildRecordFieldStoreKey(key, fieldName);
            returnEntries[fieldKey] = { data: field };
        }

        // we need to restore the undefined __ref node as it is
        // lost during serialization
        if (link.isMissing === true) {
            normalizedFields[fieldName] = { ...link, __ref: undefined };
        } else {
            normalizedFields[fieldName] = link;
        }
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
 * @param currentUserId the current login user id
 * @param {DraftAction<RecordRepresentation>} draft
 * @returns {DurableStoreEntry<DurableRecordRepresentation>}
 */
function createSyntheticRecord(
    currentUserId: string,
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
    const timestampString = draft.timestamp.toString();
    const draftRecord = buildSyntheticRecordRepresentation(
        currentUserId,
        draftId,
        apiName,
        fields,
        timestampString,
        timestampString
    );

    const links: { [key: string]: StoreLink } = {};
    const keys = ObjectKeys(draftRecord.fields);
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
                draftActionIds: [draft.id],
            },
            links,
        },
    };
}

function getRecordEntriesWithDraftOverlays(
    durableEntries: DurableStoreEntries<DurableRecordRepresentation>,
    draftActionMap: DraftActionMap,
    userId: string
) {
    const returnEntries: DurableStoreEntries<DurableRecordRepresentation> = ObjectCreate(null);
    const keys = ObjectKeys(durableEntries);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = durableEntries[key];
        const drafts = (draftActionMap[key] as Readonly<DraftAction<RecordRepresentation>[]>) || [];

        if (isStoreKeyRecordId(key) && !isStoreRecordError(value.data)) {
            ObjectAssign(
                returnEntries,
                normalizeRecordFields(
                    key,
                    value as DurableStoreEntry<DurableRecordRepresentation>,
                    [...drafts],
                    userId
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

function getSyntheticRecordEntries(
    draftRecordKeys: string[],
    draftActionMap: DraftActionMap,
    currentUserId: string
) {
    const returnEntries: DurableStoreEntries<DurableRecordRepresentation> = ObjectCreate(null);
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
        const record = createSyntheticRecord(currentUserId, postDraft);
        if (record === undefined) {
            // we failed to create a synthetic record likely due to a corrupt DraftAction
            // return undefined for the entire request
            return undefined;
        }
        ObjectAssign(returnEntries, normalizeRecordFields(draftKey, record, drafts, currentUserId));
    }
    return returnEntries;
}

export function makeDurableStoreDraftAware(
    durableStore: DurableStore,
    plugins: DurableStoreSetEntryPlugin[],
    draftQueue: DraftQueue,
    store: Store,
    isDraftId: (id: string) => boolean,
    registerDraftKeyMapping: (draftKey: string, canonicalKey: string) => void,
    currentUserId: string
): DurableStore {
    // overrides getEntries to check if any of the requested entries is a record or a record field
    // since we are storing record fields denormalized in the durable store, we will request the record
    // and normalize the fields as it comes out of the durable store.
    // Before normalizing the fields, we will query the draft queue to determine if the record has any pending
    // draft actions. If so we will apply the drafts to the denormalized record prior to normalizing into StoreLinks
    const getEntries: typeof durableStore['getEntries'] = function<T>(
        entries: string[]
    ): Promise<DurableStoreEntries<T> | undefined> {
        const { length: entriesLength } = entries;
        if (entriesLength === 0) {
            return Promise.resolve({});
        }

        // filtered list of entry ids that excludes draft-created records
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
            .then((durableEntries: DurableStoreEntries<unknown> | undefined) => {
                if (durableEntries === undefined && filteredEntryIds.length > 0) {
                    return undefined;
                }

                return draftQueue.getActionsForTags(allRecordKeys).then(draftActionMap => {
                    const returnEntries: DurableStoreEntries<T> = ObjectCreate(null);
                    if (durableEntries !== undefined) {
                        const existingEntriesWithDrafts = getRecordEntriesWithDraftOverlays(
                            durableEntries as DurableStoreEntries<DurableRecordRepresentation>,
                            draftActionMap,
                            currentUserId
                        );
                        ObjectAssign(returnEntries, existingEntriesWithDrafts);
                    }

                    // include synthetic draft-created records in returnEntries if any requested ids are draft ids
                    if (draftRecordKeys.length > 0) {
                        const syntheticRecordEntries = getSyntheticRecordEntries(
                            draftRecordKeys,
                            draftActionMap,
                            currentUserId
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
    const setEntries: typeof durableStore['setEntries'] = function<T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        const putRecords: { [key: string]: boolean } = {};

        const { records: storeRecords, recordExpirations: storeExpirations } = store;

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

                const recordEntries = (entries as unknown) as DurableStoreEntries<
                    DraftRecordRepresentationNormalized
                >;
                const entry = recordEntries[recordKey];
                let record = entry && entry.data;
                if (record === undefined) {
                    record = storeRecords[recordKey];
                }

                if (record === undefined || isDraftId(record.id)) {
                    // don't put draft created items to durable store
                    continue;
                }

                putRecords[recordId] = true;

                if (isStoreRecordError(record)) {
                    putEntries[recordKey] = value;
                    continue;
                }

                let expiration = entry && entry.expiration;
                if (entry === undefined) {
                    expiration = storeExpirations[recordKey];
                }

                const denormalizedValue = denormalizeRecordFields(
                    {
                        expiration,
                        data: record,
                    },
                    storeRecords,
                    recordEntries
                );
                if (denormalizedValue !== undefined) {
                    putEntries[recordKey] = denormalizedValue;
                }
            } else {
                putEntries[key] = value;
            }

            for (let j = 0, len = plugins.length; j < len; j++) {
                const plugin = plugins[j];
                plugin.beforeSet(key, value, segment);
            }
        }

        // TODO - W-9099212 - uncomment this if-block once draft-created records
        // go into DS.  We can't do this yet because draft-created records do not
        // actually go into default segment today.  If we don't call broadcast then
        // subscribers to draft-created never emit.
        // if (ObjectKeys(putEntries).length === 0) {
        //     return Promise.resolve(undefined);
        // }

        return durableStore.setEntries(putEntries, segment);
    };

    /**
     * Intercepts durable store changes to determine if a change to a draft action was made.
     * If a DraftAction changes, we need to evict the affected record from the in memory store
     * So it rebuilds with the new draft action applied to it
     */
    const registerOnChangeListener: typeof durableStore['registerOnChangedListener'] = function(
        listener: OnDurableStoreChangedListener
    ): () => Promise<void> {
        return durableStore.registerOnChangedListener((changes: DurableStoreChange[]) => {
            const draftIdMappingsIds: string[] = [];
            const draftIdMappingSegmentChanges: DurableStoreChange[] = [];
            const draftSegmentChanges: DurableStoreChange[] = [];
            const otherSegmentChanges: DurableStoreChange[] = [];

            for (let i = 0, len = changes.length; i < len; i++) {
                const change = changes[i];

                switch (change.segment) {
                    case DRAFT_ID_MAPPINGS_SEGMENT:
                        draftIdMappingsIds.push(...change.ids);
                        draftIdMappingSegmentChanges.push(change);
                        continue;
                    case DRAFT_SEGMENT:
                        draftSegmentChanges.push(change);
                        continue;
                    default:
                        otherSegmentChanges.push(change);
                }
            }

            const calculateCombinedChanges = () => {
                const remappedDraftChanges: DurableStoreChange[] = [];
                for (let i = 0, len = draftSegmentChanges.length; i < len; i++) {
                    const draftChange = draftSegmentChanges[i];
                    const changedIds: string[] = [];

                    for (let j = 0, idLen = draftChange.ids.length; j < idLen; j++) {
                        const key = draftChange.ids[j];
                        const recordKey = extractRecordKeyFromDraftDurableStoreKey(key);
                        if (recordKey !== undefined) {
                            changedIds.push(recordKey);
                        } else {
                            changedIds.push(key);
                        }
                    }

                    remappedDraftChanges.push({
                        ...draftChange,
                        ids: changedIds,
                        isExternalChange: true,
                        segment: DefaultDurableSegment,
                    });
                }

                const combinedChanges = remappedDraftChanges
                    .concat(otherSegmentChanges)
                    .concat(draftIdMappingSegmentChanges)
                    .concat(draftSegmentChanges);
                return listener(combinedChanges);
            };

            if (draftIdMappingsIds.length > 0) {
                return durableStore
                    .getEntries(draftIdMappingsIds, DRAFT_ID_MAPPINGS_SEGMENT)
                    .then(mappingEntries => {
                        if (mappingEntries !== undefined) {
                            const keys = ObjectKeys(mappingEntries);
                            for (const key of keys) {
                                const entry = mappingEntries[key] as DurableStoreEntry<
                                    DraftIdMappingEntry
                                >;
                                const { draftKey, canonicalKey } = entry.data;
                                registerDraftKeyMapping(draftKey, canonicalKey);
                            }
                        }

                        calculateCombinedChanges();
                    });
            }

            calculateCombinedChanges();
        });
    };

    return ObjectCreate(durableStore, {
        getEntries: { value: getEntries },
        setEntries: { value: setEntries },
        registerOnChangedListener: { value: registerOnChangeListener },
    });
}
