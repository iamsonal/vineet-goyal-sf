import {
    DefaultDurableSegment,
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { isLDSDraftAction } from '../actionHandlers/LDSActionHandler';
import { DraftAction, DraftActionStatus } from '../DraftQueue';
import { DRAFT_SEGMENT } from '../DurableDraftQueue';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import {
    buildSyntheticRecordRepresentation,
    DurableRecordEntry,
    extractRecordKeyFromDraftDurableStoreKey,
    GetDraftActionsForRecords,
    getDraftResolutionInfoForRecordSet,
    getObjectApiNamesFromDraftCreateEntries,
    isDraftActionStoreRecordKey,
    isStoreRecordError,
    removeDrafts,
    replayDraftsOnRecord,
} from '../utils/records';
import { ResourceRequest } from '@luvio/engine';
import { getObjectInfos } from '../utils/objectInfo';

function persistDraftCreates(
    entries: DurableStoreEntries<DraftAction<RecordRepresentation, ResourceRequest>>,
    durableStore: DurableStore,
    userId: string
): Promise<void> {
    const keys = ObjectKeys(entries);
    if (keys.length === 0) {
        return Promise.resolve();
    }
    const apiNames = getObjectApiNamesFromDraftCreateEntries(entries);
    return getObjectInfos(durableStore, apiNames).then((objectInfos) => {
        const draftCreates: DurableStoreEntries<DurableRecordEntry> = {};

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const entry = entries[key];
            const action = entry.data;
            const request = action.data;
            if (process.env.NODE_ENV !== 'production') {
                if (request.method !== 'post') {
                    throw Error('attempting to generate synthetic record from non post request');
                }
            }
            const apiName = request.body.apiName;
            const syntheticRecord = buildSyntheticRecordRepresentation(
                action,
                userId,
                objectInfos[apiName]
            );
            draftCreates[action.tag] = { data: syntheticRecord };
        }

        return durableStore.setEntries(draftCreates, DefaultDurableSegment);
    });
}

function onDraftEntriesChanged(
    keys: string[],
    durableStore: DurableStore,
    getDraftActionsForRecords: GetDraftActionsForRecords,
    userId: string
) {
    const recordKeys: string[] = [];
    // extract record key from draft entry key
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const recordKey = extractRecordKeyFromDraftDurableStoreKey(key);
        if (recordKey !== undefined) {
            recordKeys.push(recordKey);
        }
    }
    return resolveDrafts(recordKeys, durableStore, getDraftActionsForRecords, userId);
}

/**
 * Resolves the current state of the draft queue on a passed in set of record keys and
 * re-writes the updated value to the durable store
 * @param recordKeys keys of records needing draft resolution
 * @param durableStore durable store
 * @param getDraftActionsForRecords function to get draft actions for a set of records
 * @param userId logged in user id
 */
function resolveDrafts(
    recordKeys: string[],
    durableStore: DurableStore,
    getDraftActionsForRecords: GetDraftActionsForRecords,
    userId: string
) {
    return durableStore
        .getEntries<DurableRecordEntry>(recordKeys, DefaultDurableSegment)
        .then((entries) => {
            if (entries === undefined) {
                return;
            }
            // get object infos and drafts so we can replay the drafts on the merged result
            return getDraftResolutionInfoForRecordSet(
                entries,
                durableStore,
                getDraftActionsForRecords
            ).then((draftResolutionInfo) => {
                const updatedRecords: {
                    [key: string]: DurableStoreEntry<DurableRecordEntry>;
                } = {};

                let keys = ObjectKeys(entries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const recordKey = keys[i];
                    const entry = entries[recordKey];

                    const { data: record, metadata } = entry;

                    // cannot apply drafts to an error
                    if (isStoreRecordError(record)) {
                        continue;
                    }

                    const { objectInfo, drafts } = draftResolutionInfo[recordKey];

                    const baseRecord = removeDrafts(record);

                    if (drafts === undefined || drafts.length === 0) {
                        if (baseRecord === undefined) {
                            // baseRecord doesn't exist and there's no drafts to apply
                            continue;
                        }
                        updatedRecords[recordKey] = { data: baseRecord, metadata };
                    } else {
                        const replayDrafts = [...drafts];

                        const resolvedRecord = replayDraftsOnRecord(
                            baseRecord,
                            replayDrafts,
                            objectInfo,
                            userId
                        );
                        updatedRecords[recordKey] = { data: resolvedRecord, metadata };
                    }
                }

                if (ObjectKeys(updatedRecords).length > 0) {
                    return durableStore.setEntries(updatedRecords, DefaultDurableSegment);
                }
            });
        });
}

function isEntryDraftAction(
    entry: DurableStoreEntry<any>,
    key: string
): entry is DurableStoreEntry<DraftAction<RecordRepresentation, unknown>> {
    return (
        entry.data.status !== undefined &&
        (entry.data.status === DraftActionStatus.Completed ||
            entry.data.status === DraftActionStatus.Error ||
            entry.data.status === DraftActionStatus.Pending ||
            entry.data.status === DraftActionStatus.Uploading) &&
        isDraftActionStoreRecordKey(key)
    );
}

/**
 * Higher order function that observes changes made to the draft store and updates relevant records
 * in the store with their current draft state
 * @param durableStore durable store
 * @param getDraftActionsForRecords function to get set of draft actions for record ids
 * @param userId logged in user id
 * @returns
 */
export function makeDurableStoreDraftAware(
    durableStore: DurableStore,
    getDraftActionsForRecords: GetDraftActionsForRecords,
    userId: string
): DurableStore {
    const setEntries: typeof durableStore['setEntries'] = function <T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        if (segment !== DRAFT_SEGMENT) {
            return durableStore.setEntries(entries, segment);
        }

        const draftCreateEntries: DurableStoreEntries<
            DraftAction<RecordRepresentation, ResourceRequest>
        > = {};
        let hasDraftEntries = false;
        const keys = ObjectKeys(entries);
        const changedKeys: string[] = [];
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const entry = entries[key];
            if (isEntryDraftAction(entry, key) && isLDSDraftAction(entry.data)) {
                if (entry.data.data.method !== 'post') {
                    changedKeys.push(key);
                } else {
                    draftCreateEntries[key] = entry as DurableStoreEntry<
                        DraftAction<RecordRepresentation, ResourceRequest>
                    >;
                }

                hasDraftEntries = true;
            }
        }

        // change made to a draft action require affected records to be resolved
        return durableStore.setEntries(entries, segment).then(() => {
            if (hasDraftEntries === true) {
                return persistDraftCreates(draftCreateEntries, durableStore, userId).then(() => {
                    return onDraftEntriesChanged(
                        changedKeys,
                        durableStore,
                        getDraftActionsForRecords,
                        userId
                    );
                });
            }
        });
    };

    const evictEntries: typeof durableStore['evictEntries'] = function <T>(
        entryIds: string[],
        segment: string
    ) {
        if (segment !== DRAFT_SEGMENT) {
            return durableStore.evictEntries(entryIds, segment);
        }

        return durableStore
            .evictEntries(entryIds, segment)
            .then(() =>
                onDraftEntriesChanged(entryIds, durableStore, getDraftActionsForRecords, userId)
            );
    };

    const batchOperations: typeof durableStore['batchOperations'] = function <T>(
        operations: DurableStoreOperation<T>[]
    ): Promise<void> {
        let changedDraftKeys: string[] = [];
        let persistOperations: Promise<any>[] = [];
        for (let i = 0, len = operations.length; i < len; i++) {
            const operation = operations[i];
            if (
                operation.segment === DRAFT_SEGMENT &&
                operation.type === DurableStoreOperationType.EvictEntries
            ) {
                changedDraftKeys = changedDraftKeys.concat(operation.ids);
            }
            if (
                operation.segment === DRAFT_SEGMENT &&
                operation.type === DurableStoreOperationType.SetEntries
            ) {
                const keys = ObjectKeys(operation.entries);

                const draftCreateEntries: DurableStoreEntries<
                    DraftAction<RecordRepresentation, ResourceRequest>
                > = {};
                const { entries } = operation;

                // check entries for any LDS actions that create records
                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    const entry = entries[key];
                    if (isEntryDraftAction(entry, key) && isLDSDraftAction(entry.data)) {
                        if (entry.data.data.method === 'post') {
                            draftCreateEntries[key] = entry as DurableStoreEntry<
                                DraftAction<RecordRepresentation, ResourceRequest>
                            >;
                        } else {
                            changedDraftKeys.push(key);
                        }
                    }
                }

                if (ObjectKeys(draftCreateEntries).length > 0) {
                    persistOperations.push(
                        persistDraftCreates(draftCreateEntries, durableStore, userId)
                    );
                }
            }
        }
        return durableStore.batchOperations(operations).then(() => {
            return Promise.all(persistOperations).then(() => {
                if (changedDraftKeys.length > 0) {
                    return onDraftEntriesChanged(
                        changedDraftKeys,
                        durableStore,
                        getDraftActionsForRecords,
                        userId
                    );
                }
            });
        });
    };

    return ObjectCreate(durableStore, {
        setEntries: { value: setEntries, writable: true },
        evictEntries: { value: evictEntries, writable: true },
        batchOperations: { value: batchOperations, writable: true },
    });
}
