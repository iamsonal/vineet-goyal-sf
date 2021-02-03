import {
    DraftQueue,
    DraftAction,
    CompletedDraftAction,
    PendingDraftAction,
    ErrorDraftAction,
    DraftActionMap,
    DraftActionStatus,
    ProcessActionResult,
    ObjectAsSet,
    DraftQueueState,
    DraftQueueChangeListener,
} from './DraftQueue';
import { ResourceRequest, NetworkAdapter, FetchResponse } from '@luvio/engine';
import { ObjectKeys } from './utils/language';
import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import { buildDraftDurableStoreKey } from './utils/records';

export const DraftDurableSegment = 'DRAFT';

/**
 * Generates a time-ordered, unique id to associate with a DraftAction. Ensures
 * no collisions with existing draft action IDs.
 */
function generateUniqueDraftActionId(existingIds: string[]) {
    // new id in milliseconds with some extra digits for collisions
    let newId = new Date().getTime() * 100;

    const existingAsNumbers = existingIds
        .map(id => parseInt(id, 10))
        .filter(parsed => !isNaN(parsed));

    let counter = 0;
    while (existingAsNumbers.includes(newId)) {
        newId += 1;
        counter += 1;

        // if the counter is 100+ then somehow this method has been called 100
        // times in one millisecond
        if (counter >= 100) {
            throw new Error('Unable to generate unique new draft ID');
        }
    }

    return newId.toString();
}

function isErrorFetchResponse<T>(error: unknown): error is FetchResponse<T> {
    return typeof error === 'object' && error !== null && 'status' in error;
}

export class DurableDraftQueue implements DraftQueue {
    private durableStore: DurableStore;
    private networkAdapter: NetworkAdapter;
    private draftQueueChangedListeners: DraftQueueChangeListener[] = [];
    private state = DraftQueueState.Stopped;

    constructor(store: DurableStore, network: NetworkAdapter) {
        this.durableStore = store;
        this.networkAdapter = network;
    }

    getQueueState(): DraftQueueState {
        return this.state;
    }

    actionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return queue.filter(action => action.tag === tag);
    }

    deleteActionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return this.actionsForTag(tag, queue).filter(action => action.request.method === 'delete');
    }

    getQueueActions(): Promise<DraftAction<unknown>[]> {
        return this.durableStore.getAllEntries(DraftDurableSegment).then(durableEntries => {
            const queue: DraftAction<unknown>[] = [];
            if (durableEntries === undefined) {
                return queue;
            }
            const keys = ObjectKeys(durableEntries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const entry = durableEntries[keys[i]];
                queue.push(entry.data);
            }

            return queue.sort((a, b) => {
                const aTime = parseInt(a.id, 10);
                const bTime = parseInt(b.id, 10);

                // safety check
                if (isNaN(aTime)) {
                    return 1;
                }
                if (isNaN(bTime)) {
                    return -1;
                }

                return aTime - bTime;
            });
        });
    }

    enqueue<T>(request: ResourceRequest, tag: string): Promise<DraftAction<T>> {
        return this.getQueueActions().then(queue => {
            if (request.method === 'post' && this.actionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a POST draft action with an existing tag');
            }

            if (this.deleteActionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a draft action for a deleted record');
            }

            const id = generateUniqueDraftActionId(queue.map(a => a.id));
            const durableStoreId = buildDraftDurableStoreKey(tag, id);
            const action: PendingDraftAction<T> = {
                id,
                status: DraftActionStatus.Pending,
                request,
                tag,
                timestamp: Date.now(),
            };
            const entry: DurableStoreEntry = { data: action };
            const entries: DurableStoreEntries = { [durableStoreId]: entry };
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                this.notifyChangedListeners();
                return action;
            });
        });
    }

    getActionsForTags(tags: ObjectAsSet): Promise<DraftActionMap> {
        return this.getQueueActions().then(queue => {
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

    registerOnChangedListener(listener: DraftQueueChangeListener): () => Promise<void> {
        this.draftQueueChangedListeners.push(listener);
        return () => {
            this.draftQueueChangedListeners = this.draftQueueChangedListeners.filter(l => {
                return l !== listener;
            });
            return Promise.resolve();
        };
    }

    processNextAction(): Promise<ProcessActionResult> {
        return this.getQueueActions().then(queue => {
            const action = queue[0];
            if (action === undefined) {
                //TODO: once we have startDraftQueue/stopDraftQueue implemented this will need to be set to the last user defined state.
                this.state = DraftQueueState.Started;
                return ProcessActionResult.NO_ACTION_TO_PROCESS;
            }

            const { status, id, tag, timestamp } = action;

            if (status === DraftActionStatus.Error) {
                this.state = DraftQueueState.Error;
                return ProcessActionResult.BLOCKED_ON_ERROR;
            }

            if (status !== DraftActionStatus.Pending) {
                this.state = DraftQueueState.Started;
                return ProcessActionResult.ACTION_ALREADY_PROCESSING;
            }

            action.status = DraftActionStatus.Uploading;
            const entry: DurableStoreEntry = { data: action };
            const durableEntryKey = buildDraftDurableStoreKey(tag, id);
            const entries: DurableStoreEntries = { [durableEntryKey]: entry };
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                const { request, id, tag } = action;

                return this.networkAdapter(request)
                    .then((response: FetchResponse<any>) => {
                        return this.durableStore
                            .evictEntries([durableEntryKey], DraftDurableSegment)
                            .then(() => {
                                // process action success
                                this.notifyChangedListeners({
                                    status: DraftActionStatus.Completed,
                                    id,
                                    tag,
                                    request,
                                    response,
                                    timestamp,
                                });

                                this.state = DraftQueueState.Started;
                                return ProcessActionResult.ACTION_SUCCEEDED;
                            });
                    })
                    .catch((err: unknown) => {
                        // if the error is a FetchResponse shape then it's a bad request
                        if (isErrorFetchResponse(err)) {
                            const errorAction: ErrorDraftAction<unknown> = {
                                status: DraftActionStatus.Error,
                                id,
                                tag,
                                request,
                                error: err,
                                timestamp,
                            };

                            const entry: DurableStoreEntry = { data: errorAction };
                            const entries: DurableStoreEntries = { [durableEntryKey]: entry };
                            return this.durableStore
                                .setEntries(entries, DraftDurableSegment)
                                .then(() => {
                                    this.state = DraftQueueState.Error;
                                    return ProcessActionResult.ACTION_ERRORED;
                                });
                        }

                        // if we got here then it's a network error, set it back
                        // to pending and return response
                        action.status = DraftActionStatus.Pending;
                        return this.durableStore
                            .setEntries(entries, DraftDurableSegment)
                            .then(() => {
                                this.state = DraftQueueState.Waiting;
                                return ProcessActionResult.NETWORK_ERROR;
                            });
                    });
            });
        });
    }

    private notifyChangedListeners(completed?: CompletedDraftAction<unknown>) {
        for (let i = 0, queueLen = this.draftQueueChangedListeners.length; i < queueLen; i++) {
            const listener = this.draftQueueChangedListeners[i];
            listener(completed);
        }
    }

    removeDraftAction(actionId: string): Promise<void> {
        return this.getQueueActions().then(queue => {
            //Get the store key for the removed action
            const actions = queue.filter(action => action.id === actionId);
            if (actions.length === 0) {
                throw new Error(`No removable action with id ${actionId}`);
            }

            const action = actions[0];
            if (action.status === DraftActionStatus.Uploading) {
                throw new Error(`Cannot remove an uploading draft action with ID ${actionId}`);
            }

            let durableStoreKey = buildDraftDurableStoreKey(action.tag, action.id);

            return this.durableStore
                .evictEntries([durableStoreKey], DraftDurableSegment)
                .then(() => {
                    this.notifyChangedListeners();
                });
        });
    }
}
