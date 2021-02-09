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
    DraftQueueEvent,
    DraftQueueEventType,
    UploadingDraftAction,
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
    private retryIntervalMilliseconds: number = 0;
    private minimumRetryInterval: number = 250;
    private maximumRetryInterval: number = 32000;
    private durableStore: DurableStore;
    private networkAdapter: NetworkAdapter;
    private draftQueueChangedListeners: DraftQueueChangeListener[] = [];
    private state = DraftQueueState.Stopped;
    private processingAction?: Promise<ProcessActionResult>;

    constructor(store: DurableStore, network: NetworkAdapter) {
        this.durableStore = store;
        this.networkAdapter = network;
    }

    getQueueState(): DraftQueueState {
        return this.state;
    }

    startQueue(): Promise<void> {
        if (this.state === DraftQueueState.Started) {
            return Promise.resolve();
        }
        this.state = DraftQueueState.Started;
        this.retryIntervalMilliseconds = 0;
        return this.processNextAction().then(result => {
            switch (result) {
                case ProcessActionResult.BLOCKED_ON_ERROR:
                    this.state = DraftQueueState.Error;
                    return Promise.reject();

                default:
                    return Promise.resolve();
            }
        });
    }

    stopQueue(): Promise<void> {
        this.state = DraftQueueState.Stopped;
        return Promise.resolve();
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
            this.notifyChangedListeners({
                type: DraftQueueEventType.ActionAdding,
                action: action,
            });
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionAdded,
                    action: action,
                });
                if (this.state === DraftQueueState.Started) {
                    this.processNextAction();
                }
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
        if (this.processingAction !== undefined) {
            return this.processingAction;
        }
        this.processingAction = this.getQueueActions().then(queue => {
            const action = queue[0];
            if (action === undefined) {
                this.processingAction = undefined;
                return ProcessActionResult.NO_ACTION_TO_PROCESS;
            }

            const { status, id, tag, timestamp } = action;

            if (status === DraftActionStatus.Error) {
                this.state = DraftQueueState.Error;
                this.processingAction = undefined;
                return ProcessActionResult.BLOCKED_ON_ERROR;
            }

            if (status !== DraftActionStatus.Pending) {
                this.state = DraftQueueState.Started;
                this.processingAction = undefined;
                return ProcessActionResult.ACTION_ALREADY_PROCESSING;
            }

            action.status = DraftActionStatus.Uploading;
            const entry: DurableStoreEntry = { data: action };
            const durableEntryKey = buildDraftDurableStoreKey(tag, id);
            const entries: DurableStoreEntries = { [durableEntryKey]: entry };
            return this.durableStore.setEntries(entries, DraftDurableSegment).then(() => {
                this.processingAction = undefined;
                const { request, id, tag } = action;

                if (this.state === DraftQueueState.Waiting) {
                    this.state = DraftQueueState.Started;
                }

                this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionRunning,
                    action: action as UploadingDraftAction<unknown>,
                });

                return this.networkAdapter(request)
                    .then((response: FetchResponse<any>) => {
                        const completedAction: CompletedDraftAction<unknown> = {
                            status: DraftActionStatus.Completed,
                            id,
                            tag,
                            request,
                            response,
                            timestamp,
                        };

                        // notify that consumers that this action is completed and about to be removed from the draft queue
                        return this.notifyChangedListeners({
                            type: DraftQueueEventType.ActionCompleting,
                            action: completedAction,
                        }).then(() => {
                            return this.durableStore
                                .evictEntries([durableEntryKey], DraftDurableSegment)
                                .then(() => {
                                    this.retryIntervalMilliseconds = 0;
                                    // process action success
                                    return this.notifyChangedListeners({
                                        type: DraftQueueEventType.ActionCompleted,
                                        action: completedAction,
                                    }).then(() => {
                                        if (this.state === DraftQueueState.Started) {
                                            this.processNextAction();
                                        }
                                        return ProcessActionResult.ACTION_SUCCEEDED;
                                    });
                                });
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
                                    return this.notifyChangedListeners({
                                        type: DraftQueueEventType.ActionFailed,
                                        action: errorAction,
                                    }).then(() => {
                                        return ProcessActionResult.ACTION_ERRORED;
                                    });
                                });
                        }

                        // if we got here then it's a network error, set it back
                        // to pending and return response
                        action.status = DraftActionStatus.Pending;
                        return this.durableStore
                            .setEntries(entries, DraftDurableSegment)
                            .then(() => {
                                if (this.state === DraftQueueState.Stopped) {
                                    return ProcessActionResult.NETWORK_ERROR;
                                }
                                this.state = DraftQueueState.Waiting;
                                return this.notifyChangedListeners({
                                    type: DraftQueueEventType.ActionRetrying,
                                    action: action as PendingDraftAction<unknown>,
                                }).then(() => {
                                    this.scheduleRetry();
                                    return ProcessActionResult.NETWORK_ERROR;
                                });
                            });
                    });
            });
        });
        return this.processingAction;
    }

    private notifyChangedListeners(event: DraftQueueEvent) {
        var results: Promise<void>[] = [];
        const { draftQueueChangedListeners } = this;
        const { length: draftQueueLen } = draftQueueChangedListeners;
        for (let i = 0; i < draftQueueLen; i++) {
            const listener = draftQueueChangedListeners[i];
            results.push(listener(event));
        }
        return Promise.all(results).then(() => {
            return Promise.resolve();
        });
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
                    this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionDeleted,
                        action,
                    });
                });
        });
    }

    private scheduleRetry() {
        const newInterval = this.retryIntervalMilliseconds * 2;
        this.retryIntervalMilliseconds = Math.min(
            Math.max(newInterval, this.minimumRetryInterval),
            this.maximumRetryInterval
        );
        setTimeout((): void => {
            this.processNextAction();
        }, this.retryIntervalMilliseconds);
    }
}
