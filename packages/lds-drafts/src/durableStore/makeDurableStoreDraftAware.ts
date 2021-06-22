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
import { DraftAction, DraftActionMap, DraftActionStatus } from '../DraftQueue';
import { DRAFT_SEGMENT } from '../DurableDraftQueue';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import {
    buildSyntheticRecordRepresentation,
    DurableRecordRepresentation,
    extractRecordKeyFromDraftDurableStoreKey,
    isDraftActionStoreRecordKey,
    removeDrafts,
    replayDraftsOnRecord,
} from '../utils/records';
import { ResourceRequest } from '@luvio/engine';

type GetDraftActionsForRecords = (keys: string[]) => Promise<DraftActionMap>;

function persistDraftCreates(
    entries: DurableStoreEntries<DraftAction<RecordRepresentation, ResourceRequest>>,
    durableStore: DurableStore,
    userId: string
) {
    const keys = ObjectKeys(entries);
    const draftCreates: DurableStoreEntries<DurableRecordRepresentation> = {};
    let shouldWrite = false;

    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const entry = entries[key];
        const action = entry.data;
        if (action.data.method === 'post') {
            const syntheticRecord = buildSyntheticRecordRepresentation(action, userId);
            draftCreates[action.tag] = { data: syntheticRecord };
            shouldWrite = true;
        }
    }

    if (shouldWrite) {
        return durableStore.setEntries(draftCreates, DefaultDurableSegment);
    }
    return Promise.resolve();
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
        .getEntries<DurableRecordRepresentation>(recordKeys, DefaultDurableSegment)
        .then((entries) => {
            if (entries === undefined) {
                return;
            }

            return getDraftActionsForRecords(recordKeys).then((actions) => {
                const updatedRecords: {
                    [key: string]: DurableStoreEntry<DurableRecordRepresentation>;
                } = {};

                for (let i = 0, len = recordKeys.length; i < len; i++) {
                    const recordKey = recordKeys[i];
                    const entry = entries[recordKey];
                    if (entry === undefined) {
                        continue;
                    }

                    const { data: record, expiration } = entry;

                    const drafts =
                        (actions[recordKey] as DraftAction<
                            RecordRepresentation,
                            ResourceRequest
                        >[]) || [];

                    const baseRecord = removeDrafts(record);

                    if (drafts === undefined || drafts.length === 0) {
                        if (baseRecord === undefined) {
                            // baseRecord doesn't exist and there's no drafts to apply
                            continue;
                        }
                        updatedRecords[recordKey] = { data: baseRecord, expiration };
                    } else {
                        const replayDrafts = [...drafts];

                        const resolvedRecord = replayDraftsOnRecord(
                            baseRecord,
                            replayDrafts,
                            userId
                        );
                        updatedRecords[recordKey] = { data: resolvedRecord, expiration };
                    }
                }

                return durableStore.setEntries(updatedRecords, DefaultDurableSegment);
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

        const draftEntries: DurableStoreEntries<
            DraftAction<RecordRepresentation, ResourceRequest>
        > = {};
        let hasDraftEntries = false;
        const keys = ObjectKeys(entries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const entry = entries[key];
            if (isEntryDraftAction(entry, key)) {
                if (isLDSDraftAction(entry.data)) {
                    draftEntries[key] = entry as DurableStoreEntry<
                        DraftAction<RecordRepresentation, ResourceRequest>
                    >;
                    hasDraftEntries = true;
                }
            }
        }

        // change made to a draft action require affected records to be resolved
        return durableStore.setEntries(entries, segment).then(() => {
            if (hasDraftEntries === true) {
                return persistDraftCreates(draftEntries, durableStore, userId).then(() => {
                    return onDraftEntriesChanged(
                        ObjectKeys(entries),
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

                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    const entry = operation.entries[key];
                    if (isEntryDraftAction(entry, key)) {
                        if (isLDSDraftAction(entry.data)) {
                            changedDraftKeys.push(key);
                            persistOperations.push(
                                persistDraftCreates(
                                    operation.entries as unknown as DurableStoreEntries<
                                        DraftAction<RecordRepresentation, ResourceRequest>
                                    >,
                                    durableStore,
                                    userId
                                )
                            );
                        }
                    }
                }
            }
        }
        return durableStore.batchOperations(operations).then(() => {
            if (changedDraftKeys.length > 0) {
                return Promise.all(persistOperations).then(() => {
                    return onDraftEntriesChanged(
                        changedDraftKeys,
                        durableStore,
                        getDraftActionsForRecords,
                        userId
                    );
                });
            }
        });
    };

    return ObjectCreate(durableStore, {
        setEntries: { value: setEntries, writable: true },
        evictEntries: { value: evictEntries, writable: true },
        batchOperations: { value: batchOperations, writable: true },
    });
}
