import type { ResourceRequest } from '@luvio/engine';
import type { DurableStore, DurableStoreEntry, DurableStoreOperation } from '@luvio/environments';
import { DurableStoreOperationType } from '@luvio/environments';

import type { DraftAction, DraftIdMappingEntry, QueueOperation } from './DraftQueue';
import { QueueOperationType } from './DraftQueue';
import type { DraftStore } from './DraftStore';
import { DRAFT_ID_MAPPINGS_SEGMENT } from './DurableDraftQueue';
import { DRAFT_SEGMENT } from './main';
import { ObjectKeys } from './utils/language';
import { buildDraftDurableStoreKey } from './utils/records';

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
    getAllDrafts<_R, _D>(): Promise<DraftAction<unknown, unknown>[]> {
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

    completeAction(queueOperations: QueueOperation[], mapping: DraftIdMappingEntry | undefined) {
        const action = () => {
            const durableStoreOperations: DurableStoreOperation<
                DraftAction<unknown, unknown> | DraftIdMappingEntry
            >[] = [];

            const { draftStore } = this;
            for (let i = 0, len = queueOperations.length; i < len; i++) {
                const operation = queueOperations[i];
                if (operation.type === QueueOperationType.Delete) {
                    const action = draftStore[operation.id];
                    if (action !== undefined) {
                        delete draftStore[operation.id];
                        const key = buildDraftDurableStoreKey(action.tag, action.id);
                        durableStoreOperations.push({
                            ids: [key],
                            type: DurableStoreOperationType.EvictEntries,
                            segment: DRAFT_SEGMENT,
                        });
                    }
                } else {
                    const { action } = operation;
                    const key = buildDraftDurableStoreKey(action.tag, action.id);
                    draftStore[action.id] = action;
                    durableStoreOperations.push({
                        type: DurableStoreOperationType.SetEntries,
                        segment: DRAFT_SEGMENT,
                        entries: {
                            [key]: {
                                data: operation.action as DraftAction<Response, ResourceRequest>,
                            },
                        },
                    });
                }
            }

            if (mapping !== undefined) {
                const mappingKey = `DraftIdMapping::${mapping.draftId}::${mapping.canonicalId}`;

                durableStoreOperations.push({
                    entries: { [mappingKey]: { data: mapping } },
                    type: DurableStoreOperationType.SetEntries,
                    segment: DRAFT_ID_MAPPINGS_SEGMENT,
                });
            }

            return this.durableStore.batchOperations(durableStoreOperations);
        };

        return this.enqueueAction(action);
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
