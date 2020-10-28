import {
    DraftQueue,
    DraftAction,
    DraftQueueCompletedListener,
    PendingDraftAction,
    ErrorDraftAction,
    DraftActionMap,
    DraftActionStatus,
    ProcessActionResult,
} from './DraftQueue';
import { ResourceRequest, NetworkAdapter, FetchResponse } from '@ldsjs/engine';
import { ObjectKeys } from './utils/language';
import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@ldsjs/environments';
import { buildDraftActionKey, extractDraftActionIdFromDraftActionKey } from './utils/records';

export const DraftDurableSegment = 'DRAFT';

/**
 * Generates a unique id to associate with a DraftAction
 */
function generateUniqueDraftActionId() {
    //TODO: This doesn't work if called twice in a millisecond
    return new Date().getTime().toString();
}

export class DurableDraftQueue implements DraftQueue {
    private durableStore: DurableStore;
    private networkAdapter: NetworkAdapter;
    private draftQueueCompletedListeners: DraftQueueCompletedListener[] = [];

    constructor(store: DurableStore, network: NetworkAdapter) {
        this.durableStore = store;
        this.networkAdapter = network;
    }

    actionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return queue.filter(element => element.tag === tag);
    }

    deleteActionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return this.actionsForTag(tag, queue).filter(element => {
            return element.request.method === 'delete';
        });
    }

    private persistedQueue(): Promise<DraftAction<unknown>[]> {
        return this.durableStore.getAllEntries(DraftDurableSegment).then(durableEntries => {
            const queue: DraftAction<unknown>[] = [];
            if (durableEntries === undefined) {
                return queue;
            }
            const keys = ObjectKeys(durableEntries).sort();
            for (let i = 0, len = keys.length; i < len; i++) {
                const entry = durableEntries[keys[i]];
                queue.push(entry.data);
            }

            return queue;
        });
    }

    enqueue<T>(request: ResourceRequest, tag: string): Promise<DraftAction<T>> {
        return this.persistedQueue().then(queue => {
            if (request.method === 'post' && this.actionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a POST draft action with an existing tag');
            }

            if (this.deleteActionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a draft action for a deleted record');
            }

            let id = generateUniqueDraftActionId();
            while (
                queue.find(element => extractDraftActionIdFromDraftActionKey(element.id) === id)
            ) {
                id += 1;
            }
            const durableStoreId = buildDraftActionKey(tag, id);
            const action: PendingDraftAction<T> = {
                id,
                status: DraftActionStatus.Pending,
                request,
                tag,
            };
            const entry: DurableStoreEntry = { data: action };
            const entries: DurableStoreEntries = { [durableStoreId]: entry };
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                return action;
            });
        });
    }

    getActionsForTags(tags: { [tag: string]: true }): Promise<DraftActionMap> {
        return this.persistedQueue().then(queue => {
            const map: DraftActionMap = {};
            const tagKeys = ObjectKeys(tags);
            for (let i = 0, tagLen = tagKeys.length; i < tagLen; i++) {
                const tagKey = tagKeys[i];
                map[tagKey] = [];
            }

            for (let i = 0, queueLen = queue.length; i < queueLen; i++) {
                const action = queue[i];
                if (tags[action.tag] === true) {
                    const tagArray = map[action.tag];
                    tagArray.push(action);
                }
            }

            return map;
        });
    }

    registerDraftQueueCompletedListener(listener: DraftQueueCompletedListener): void {
        this.draftQueueCompletedListeners.push(listener);
    }

    processNextAction(): Promise<ProcessActionResult> {
        return this.persistedQueue().then(queue => {
            const action = queue[0];
            if (action === undefined) {
                return ProcessActionResult.NO_ACTION_TO_PROCESS;
            }

            if (action.status !== DraftActionStatus.Pending) {
                return ProcessActionResult.ACTION_ALREADY_PROCESSING;
            }

            const uploadingAction = { ...action, status: DraftActionStatus.Uploading };
            const entry: DurableStoreEntry = { data: uploadingAction };
            const entryId = buildDraftActionKey(uploadingAction.tag, uploadingAction.id);
            const entries: DurableStoreEntries = { [entryId]: entry };
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                const { request, id, tag } = action;

                return this.networkAdapter(request)
                    .then((response: FetchResponse<any>) => {
                        return this.durableStore
                            .evictEntries(
                                [buildDraftActionKey(action.tag, action.id)],
                                DraftDurableSegment
                            )
                            .then(() => {
                                // process action success
                                for (
                                    let i = 0, queueLen = this.draftQueueCompletedListeners.length;
                                    i < queueLen;
                                    i++
                                ) {
                                    const listener = this.draftQueueCompletedListeners[i];
                                    listener({
                                        status: DraftActionStatus.Completed,
                                        id,
                                        tag,
                                        request,
                                        response,
                                    });
                                }

                                return ProcessActionResult.ACTION_SUCCEEDED;
                            });
                    })
                    .catch((err: any) => {
                        const errorAction: ErrorDraftAction<unknown> = {
                            status: DraftActionStatus.Error,
                            id,
                            tag,
                            request,
                            error: err,
                        };

                        const entry: DurableStoreEntry = { data: errorAction };
                        const entryId = buildDraftActionKey(action.tag, action.id);
                        const entries: DurableStoreEntries = { [entryId]: entry };
                        return this.durableStore
                            .setEntries(entries, DraftDurableSegment)
                            .then(() => {
                                return ProcessActionResult.ACTION_ERRORED;
                            });
                    });
            });
        });
    }
}
