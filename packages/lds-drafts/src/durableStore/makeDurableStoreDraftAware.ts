import {
    DefaultDurableSegment,
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DraftAction, DraftActionMap } from '../DraftQueue';
import { DRAFT_SEGMENT } from '../DurableDraftQueue';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import {
    buildSyntheticRecordRepresentation,
    DraftRecordRepresentation,
    DurableRecordRepresentation,
    extractRecordKeyFromDraftDurableStoreKey,
    replayDraftsOnRecord,
} from '../utils/records';

type GetDraftActionsForRecords = (keys: string[]) => Promise<DraftActionMap>;

function persistDraftCreates(
    entries: DurableStoreEntries<DraftAction<RecordRepresentation>>,
    durableStore: DurableStore,
    userId: string
) {
    const keys = ObjectKeys(entries);
    const draftCreates: DurableStoreEntries<DraftRecordRepresentation> = {};
    let shouldWrite = false;

    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const entry = entries[key];
        const action = entry.data;
        if (action.request.method === 'post') {
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
        .then(entries => {
            if (entries === undefined) {
                return;
            }

            return getDraftActionsForRecords(recordKeys).then(actions => {
                const updatedRecords: {
                    [key: string]: DurableStoreEntry<DurableRecordRepresentation>;
                } = {};

                for (let i = 0, len = recordKeys.length; i < len; i++) {
                    const recordKey = recordKeys[i];
                    const { data: record, expiration } = entries[recordKey];
                    let baseRecord = removeDrafts(record);

                    const drafts =
                        (actions[recordKey] as Readonly<DraftAction<RecordRepresentation>[]>) || [];
                    if (drafts === undefined || drafts.length === 0) {
                        updatedRecords[recordKey] = { data: baseRecord, expiration };
                    } else {
                        const replayDrafts = [...drafts];

                        // if the first draft in the queue is a create, we need to generate a synthetic record
                        if (drafts[0].request.method === 'post') {
                            baseRecord = buildSyntheticRecordRepresentation(drafts[0], userId);
                            // remove the first item and and replay any other drafts on the record we just synthetically built
                            replayDrafts.shift();
                        }
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

/**
 * Restores a record to its last known server-state by removing any applied drafts it may have
 * @param record record with drafts applied
 * @returns
 */
function removeDrafts(record: DurableRecordRepresentation): DurableRecordRepresentation {
    const { drafts, fields } = record;
    if (drafts === undefined) {
        return record;
    }
    const updatedFields: { [key: string]: any } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        const originalField = drafts.serverValues[fieldName];
        if (originalField !== undefined) {
            updatedFields[fieldName] = originalField;
        } else {
            updatedFields[fieldName] = field;
        }
    }

    return { ...record, drafts: undefined, fields: updatedFields };
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
    const setEntries: typeof durableStore['setEntries'] = function<T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        if (segment !== DRAFT_SEGMENT) {
            return durableStore.setEntries(entries, segment);
        }
        // change made to a draft action require affected records to be resolved
        return durableStore.setEntries(entries, segment).then(() => {
            return persistDraftCreates(
                (entries as unknown) as DurableStoreEntries<DraftAction<RecordRepresentation>>,
                durableStore,
                userId
            ).then(() => {
                return onDraftEntriesChanged(
                    ObjectKeys(entries),
                    durableStore,
                    getDraftActionsForRecords,
                    userId
                );
            });
        });
    };

    const evictEntries: typeof durableStore['evictEntries'] = function<T>(
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

    const batchOperations: typeof durableStore['batchOperations'] = function<T>(
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
                changedDraftKeys = changedDraftKeys.concat(keys);
                persistOperations.push(
                    persistDraftCreates(
                        (operation.entries as unknown) as DurableStoreEntries<
                            DraftAction<RecordRepresentation>
                        >,
                        durableStore,
                        userId
                    )
                );
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
