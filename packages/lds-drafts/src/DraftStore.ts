import {
    DurableStore,
    DurableStoreEntry,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';
import { DraftAction, DraftIdMappingEntry } from './DraftQueue';
import { DRAFT_SEGMENT } from './main';
import { ObjectKeys } from './utils/language';
import { buildDraftDurableStoreKey, extractIdFromDraftKey } from './utils/records';

/**
 * Defines the store where drafts are persisted
 */
export interface DraftStore {
    writeAction(action: DraftAction<unknown, unknown>): Promise<void>;
    getAllDrafts(): Promise<DraftAction<unknown, unknown>[]>;
    deleteDraft(actionId: string): Promise<void>;
    deleteByTag(tag: string): Promise<void>;
    // TODO [W-9901975]: the DraftStore should not have a dependency on durable store interfaces, ActionHandler needs to be refactored for this to happen
    batchOperations(
        operations: DurableStoreOperation<DraftAction<unknown, unknown> | DraftIdMappingEntry>[]
    ): Promise<void>;
}

/**
 * Implements a write-through Store for Drafts, storing all drafts in a
 * in-memory store with a write through to the DurableStore.
 *
 * Before any reads or writes come in from the draft queue, we need to revive the draft
 * queue into memory. During this initial revive, any writes are queued up and operated on the
 * queue once it's in memory. Similary any reads are delayed until the queue is in memory.
 *
 */
export class DurableDraftStore implements DraftStore {
    private durableStore: DurableStore;
    private draftStore: Record<string, DraftAction<unknown, unknown>> = {};

    // promise that is set while the in memory draft store is being resynced with the durable store
    private syncPromise: Promise<void> | undefined;

    // queue of writes that were made during the initial sync
    private writeQueue: (() => Promise<void>)[] = [];

    constructor(durableStore: DurableStore) {
        this.durableStore = durableStore;
        this.resyncDraftStore();
    }

    writeAction(action: DraftAction<unknown, unknown>): Promise<void> {
        const addAction = () => {
            const { id, tag } = action;
            this.draftStore[id] = action;

            const durableEntryKey = buildDraftDurableStoreKey(tag, id);

            const entry: DurableStoreEntry = {
                data: action,
            };
            const entries = { [durableEntryKey]: entry };

            return this.durableStore.setEntries(entries, DRAFT_SEGMENT);
        };

        return this.enqueueAction(addAction);
    }
    getAllDrafts<R, D>(): Promise<DraftAction<unknown, unknown>[]> {
        const waitForOngoingSync = this.syncPromise || Promise.resolve();

        return waitForOngoingSync.then(() => {
            const { draftStore } = this;
            const keys = ObjectKeys(draftStore);
            const actionArray: DraftAction<unknown, unknown>[] = [];
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                actionArray.push(draftStore[key]);
            }
            return actionArray;
        });
    }
    deleteDraft(id: string): Promise<void> {
        const deleteAction = () => {
            const draft = this.draftStore[id];
            if (draft !== undefined) {
                delete this.draftStore[id];
                const durableKey = buildDraftDurableStoreKey(draft.tag, draft.id);

                return this.durableStore.evictEntries([durableKey], DRAFT_SEGMENT);
            }
            return Promise.resolve();
        };

        return this.enqueueAction(deleteAction);
    }

    deleteByTag(tag: string): Promise<void> {
        const deleteAction = () => {
            const { draftStore } = this;
            const keys = ObjectKeys(draftStore);
            const durableKeys = [];
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                const action = draftStore[key];
                if (action.tag === tag) {
                    delete draftStore[action.id];
                    durableKeys.push(buildDraftDurableStoreKey(action.tag, action.id));
                }
            }

            return this.durableStore.evictEntries(durableKeys, DRAFT_SEGMENT);
        };

        return this.enqueueAction(deleteAction);
    }

    // TODO [W-9901975]: this will go away when we decouple the durable store interface from draft store
    batchOperations(
        operations: DurableStoreOperation<DraftAction<unknown, unknown> | DraftIdMappingEntry>[]
    ): Promise<void> {
        const batchOperation = () => {
            // TODO [W-9901975]: if we both evict and set the same id (i.e. queue replacement), we need to perform the evict first on the
            // in-memory map. This will go away once pass in the queue operations to the draft store directly
            const sortedOperations = operations.sort((first, second) => {
                if (
                    first.type === DurableStoreOperationType.EvictEntries &&
                    second.type === DurableStoreOperationType.SetEntries
                ) {
                    return -1;
                }
                if (
                    first.type === DurableStoreOperationType.SetEntries &&
                    second.type === DurableStoreOperationType.EvictEntries
                ) {
                    return 1;
                }
                return 0;
            });

            sortedOperations.forEach((operation) => {
                if (operation.segment === DRAFT_SEGMENT) {
                    if (operation.type === DurableStoreOperationType.EvictEntries) {
                        const { ids } = operation;
                        for (let i = 0, len = ids.length; i < len; i++) {
                            const key = operation.ids[i];
                            const id = extractIdFromDraftKey(key);
                            if (id !== undefined) {
                                delete this.draftStore[id];
                            } else {
                                if (process.env.NODE_ENV !== 'production') {
                                    throw new Error('Expected id to be be in the draft key');
                                }
                            }
                        }
                    }
                    if (operation.type === DurableStoreOperationType.SetEntries) {
                        const keys = ObjectKeys(operation.entries);

                        for (let i = 0, len = keys.length; i < len; i++) {
                            const key = keys[i];
                            const action = operation.entries[key].data as DraftAction<
                                unknown,
                                unknown
                            >;
                            this.draftStore[action.id] = action;
                        }
                    }
                }
            });

            return this.durableStore.batchOperations(operations);
        };

        return this.enqueueAction(batchOperation);
    }

    /**
     * Runs a write operation against the draft store, if the initial
     * revive is still in progress, the action gets enqueued to run once the
     * initial revive is complete
     * @param action
     * @returns a promise that is resolved once the action has run
     */
    private enqueueAction(action: () => Promise<void>) {
        const { syncPromise, writeQueue: pendingMerges } = this;

        // if the initial sync is done and existing operations have been run, no need to queue, just run
        if (syncPromise === undefined && pendingMerges.length === 0) {
            return action();
        }

        const deferred = new Promise<void>((resolve, reject) => {
            this.writeQueue.push(() => {
                return action()
                    .then((x) => {
                        resolve(x);
                    })
                    .catch((err) => reject(err));
            });
        });

        return deferred;
    }

    /**
     * Revives the draft store from the durable store. Once the draft store is
     * revived, executes any queued up draft store operations that came in while
     * reviving
     */
    private resyncDraftStore(): Promise<void> {
        const sync = () => {
            this.syncPromise = this.durableStore
                .getAllEntries<DraftAction<unknown, unknown>>(DRAFT_SEGMENT)
                .then((durableEntries) => {
                    if (durableEntries === undefined) {
                        this.draftStore = {};
                        return;
                    }

                    const { draftStore } = this;
                    const keys = ObjectKeys(durableEntries);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        const entry = durableEntries[keys[i]];
                        const action = entry.data;
                        if (action !== undefined) {
                            draftStore[action.id] = action;
                        } else {
                            if (process.env.NODE_ENV !== 'production') {
                                const err = new Error(
                                    'Expected draft action to be defined in the durable store'
                                );
                                return Promise.reject(err);
                            }
                        }
                    }

                    return this.runQueuedOperations();
                })
                .finally(() => {
                    this.syncPromise = undefined;
                });
            return this.syncPromise;
        };

        // if there's an ongoing sync populating the in memory store, wait for it to complete before re-syncing
        const { syncPromise } = this;
        if (syncPromise === undefined) {
            return sync();
        }

        return syncPromise.then(() => {
            return sync();
        });
    }

    /**
     * Runs the operations that were queued up while reviving the
     * draft store from the durable store
     */
    private runQueuedOperations(): Promise<void> {
        const { writeQueue } = this;
        if (writeQueue.length > 0) {
            const queueItem = writeQueue.shift();
            if (queueItem !== undefined) {
                return queueItem().then(() => {
                    return this.runQueuedOperations();
                });
            }
        }
        return Promise.resolve();
    }
}
