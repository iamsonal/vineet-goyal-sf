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
    QueueOperation,
    DraftIdMappingEntry,
    QueueOperationType,
    DraftActionMetadata,
} from './DraftQueue';
import { ResourceRequest, NetworkAdapter, FetchResponse } from '@luvio/engine';
import { ObjectKeys } from './utils/language';
import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import { buildDraftDurableStoreKey } from './utils/records';

export const DRAFT_SEGMENT = 'DRAFT';
export const DRAFT_ID_MAPPINGS_SEGMENT = 'DRAFT_ID_MAPPINGS';

// retain draft id mappings for 30 days
const MAPPING_TTL = 30 * 24 * 60 * 60 * 1000;

function createDraftMappingEntryKey(draftKey: string, canonicalKey: string) {
    return `DraftIdMapping::${draftKey}::${canonicalKey}`;
}

/**
 * Generates a time-ordered, unique id to associate with a DraftAction. Ensures
 * no collisions with existing draft action IDs.
 */
export function generateUniqueDraftActionId(existingIds: string[]) {
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

/**
 * Returns a list of queue actions that should be taken after a POST action is successfully
 * uploaded
 */
type QueuePostHandler = (
    completedPost: CompletedDraftAction<unknown>,
    queue: DraftAction<unknown>[]
) => QueueOperation[];

/**
 * Extracts a mapping of a draft key to a canonical key given a completed draft action
 */
type CreateDraftIdMappingHandler = (
    completedPost: CompletedDraftAction<unknown>
) => DraftIdMappingEntry;

export class DurableDraftQueue implements DraftQueue {
    private retryIntervalMilliseconds: number = 0;
    private minimumRetryInterval: number = 250;
    private maximumRetryInterval: number = 32000;
    private durableStore: DurableStore;
    private networkAdapter: NetworkAdapter;
    private draftQueueChangedListeners: DraftQueueChangeListener[] = [];
    private state = DraftQueueState.Stopped;
    private processingAction?: Promise<ProcessActionResult>;
    private updateQueueOnPostCompletion: QueuePostHandler;
    private createDraftIdMapping: CreateDraftIdMappingHandler;
    private replacingAction?: Promise<DraftAction<unknown>>;
    private stopCalledDuringReplace: Boolean = false;

    constructor(
        store: DurableStore,
        network: NetworkAdapter,
        updateQueueOnPostCompletion: QueuePostHandler,
        createDraftIdMapping: CreateDraftIdMappingHandler
    ) {
        this.durableStore = store;
        this.networkAdapter = network;
        this.updateQueueOnPostCompletion = updateQueueOnPostCompletion;
        this.createDraftIdMapping = createDraftIdMapping;
    }

    getQueueState(): DraftQueueState {
        return this.state;
    }

    startQueue(): Promise<void> {
        if (this.state === DraftQueueState.Started) {
            return Promise.resolve();
        }
        if (this.replacingAction !== undefined) {
            // If we're replacing an action, wait until we are done
            // then start the queue
            return this.replacingAction.then(() => {
                return this.startQueue();
            });
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
        if (this.replacingAction !== undefined) {
            this.stopCalledDuringReplace = true;
        }
        return Promise.resolve();
    }

    actionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return queue.filter(action => action.tag === tag);
    }

    deleteActionsForTag(tag: string, queue: DraftAction<unknown>[]): DraftAction<unknown>[] {
        return this.actionsForTag(tag, queue).filter(action => action.request.method === 'delete');
    }

    getQueueActions(): Promise<DraftAction<unknown>[]> {
        return this.durableStore.getAllEntries(DRAFT_SEGMENT).then(durableEntries => {
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

    enqueue<T>(request: ResourceRequest, tag: string, targetId: string): Promise<DraftAction<T>> {
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
                targetId,
                status: DraftActionStatus.Pending,
                request,
                tag,
                timestamp: Date.now(),
                metadata: {},
            };
            const entry: DurableStoreEntry = { data: action };
            const entries: DurableStoreEntries = { [durableStoreId]: entry };
            this.notifyChangedListeners({
                type: DraftQueueEventType.ActionAdding,
                action: action,
            });
            return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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

            const { status, id, tag, timestamp, metadata } = action;

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
            return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
                this.processingAction = undefined;
                const { request, id, tag, targetId } = action;

                if (this.state === DraftQueueState.Waiting) {
                    this.state = DraftQueueState.Started;
                }

                this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionRunning,
                    action: action as UploadingDraftAction<unknown>,
                });

                return this.networkAdapter(request)
                    .then(this.handleDraftUploaded(action as UploadingDraftAction<unknown>))
                    .catch((err: unknown) => {
                        // if the error is a FetchResponse shape then it's a bad request
                        if (isErrorFetchResponse(err)) {
                            const errorAction: ErrorDraftAction<unknown> = {
                                status: DraftActionStatus.Error,
                                id,
                                targetId,
                                tag,
                                request,
                                error: err,
                                timestamp,
                                metadata,
                            };

                            const entry: DurableStoreEntry = { data: errorAction };
                            const entries: DurableStoreEntries = { [durableEntryKey]: entry };
                            return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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
                        return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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

    private handleDraftUploaded = (action: UploadingDraftAction<unknown>) => (
        response: FetchResponse<unknown>
    ) => {
        const completedAction: CompletedDraftAction<unknown> = {
            ...action,
            status: DraftActionStatus.Completed,
            response,
        };

        // notify that consumers that this action is completed and about to be removed from the draft queue
        return this.notifyChangedListeners({
            type: DraftQueueEventType.ActionCompleting,
            action: completedAction,
        })
            .then(() => this.updateQueueOnResponse(completedAction))
            .then(() => {
                const { tag, id } = completedAction;
                const durableEntryKey = buildDraftDurableStoreKey(tag, id);
                return this.durableStore.evictEntries([durableEntryKey], DRAFT_SEGMENT).then(() => {
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
    };

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
            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionDeleting,
                action,
            }).then(() => {
                return this.durableStore.evictEntries([durableStoreKey], DRAFT_SEGMENT).then(() => {
                    this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionDeleted,
                        action,
                    });
                });
            });
        });
    }

    replaceAction(actionId: string, withActionId: string): Promise<DraftAction<unknown>> {
        // ids must be unique
        if (actionId === withActionId) {
            return Promise.reject('Swapped and swapping action ids cannot be the same');
        }
        // cannot have a replace action already in progress
        if (this.replacingAction !== undefined) {
            return Promise.reject('Cannot replace actions while a replace action is in progress');
        }
        const initialQueueState = this.getQueueState();
        return this.stopQueue().then(() => {
            const replacing = this.getQueueActions().then(actions => {
                // get the action to replace
                const actionToReplace = actions.filter(action => action.id === actionId)[0];
                // get the replacing action
                const replacingAction = actions.filter(action => action.id === withActionId)[0];
                // reject if either action is undefined
                if (actionToReplace === undefined || replacingAction === undefined) {
                    return Promise.reject('One or both actions does not exist');
                }
                // reject if either action is uploading
                if (
                    actionToReplace.status === DraftActionStatus.Uploading ||
                    replacingAction.status === DraftActionStatus.Uploading
                ) {
                    return Promise.reject('Cannot replace an draft action that is uploading');
                }
                // reject if these two draft actions aren't acting on the same target
                if (actionToReplace.tag !== replacingAction.tag) {
                    return Promise.reject('Cannot swap actions targeting different targets');
                }
                // reject if the replacing action is not pending
                if (replacingAction.status !== DraftActionStatus.Pending) {
                    return Promise.reject('Cannot replace with a non-pending action');
                }
                const actionToReplaceCopy: PendingDraftAction<unknown> = {
                    ...actionToReplace,
                    status: DraftActionStatus.Pending,
                };

                actionToReplace.request = replacingAction.request;
                actionToReplace.status = DraftActionStatus.Pending;
                // TODO: W-8873834 - Will add batching support to durable store
                // we should use that here to remove and set both actions in one operation
                return this.removeDraftAction(replacingAction.id).then(() => {
                    const entry: DurableStoreEntry = { data: actionToReplace };
                    const durableEntryKey = buildDraftDurableStoreKey(
                        actionToReplace.tag,
                        actionToReplace.id
                    );
                    const entries: DurableStoreEntries = { [durableEntryKey]: entry };
                    return this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionUpdating,
                        action: actionToReplaceCopy,
                    }).then(() => {
                        return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
                            return this.notifyChangedListeners({
                                type: DraftQueueEventType.ActionUpdated,
                                action: actionToReplace,
                            }).then(() => {
                                if (
                                    initialQueueState === DraftQueueState.Started &&
                                    this.stopCalledDuringReplace === false
                                ) {
                                    return this.startQueue().then(() => {
                                        this.replacingAction = undefined;
                                        this.stopCalledDuringReplace = false;
                                        return actionToReplace;
                                    });
                                } else {
                                    this.replacingAction = undefined;
                                    this.stopCalledDuringReplace = false;
                                    return actionToReplace;
                                }
                            });
                        });
                    });
                });
            });
            this.replacingAction = replacing;
            return replacing;
        });
    }

    setMetadata(actionId: string, metadata: DraftActionMetadata): Promise<DraftAction<unknown>> {
        const keys = ObjectKeys(metadata);
        const compatibleKeys = keys.filter((key): boolean => {
            const value = metadata[key];
            return typeof key === 'string' && typeof value === 'string';
        });
        if (keys.length !== compatibleKeys.length) {
            return Promise.reject('Cannot save incompatible metadata');
        }
        return this.getQueueActions().then(queue => {
            const actions = queue.filter(action => action.id === actionId);
            if (actions.length === 0) {
                return Promise.reject('cannot save metadata to non-existent action');
            }

            const action = actions[0];
            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionUpdating,
                action: action,
            }).then(() => {
                action.metadata = metadata;
                const durableStoreId = buildDraftDurableStoreKey(action.tag, action.id);
                const entry: DurableStoreEntry = { data: action };
                const entries: DurableStoreEntries = { [durableStoreId]: entry };
                return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
                    return this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionUpdated,
                        action: action,
                    }).then(() => {
                        return Promise.resolve(action);
                    });
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

    /**
     * Invoked after the queue completes a POST action and creates a resource on the server.
     * Entities further down the queue may need to be updated after a resource is created on the server as they may contain references to the created item
     * The DraftQueue is unaware of the contents of the DraftActions so it calls out to the consumer with the
     * completed action and the remaining queue items. The consumer will process the completed action and indicate what
     * queue operations the DraftQueue must take to update its entries with the new entity id
     * @param action the action that just completed
     */
    private updateQueueOnResponse(action: CompletedDraftAction<unknown>): Promise<void> {
        const { request } = action;
        if (request.method !== 'post') {
            return Promise.resolve();
        }

        // TODO: W-8874402 batch write the mapping and the queue operations so they are atomically set
        return this.getQueueActions()
            .then(queue => {
                const queueOperations = this.updateQueueOnPostCompletion(action, queue);
                return this.executeBatchedQueueOperations(queueOperations);
            })
            .then(() => {
                const mapping = this.createDraftIdMapping(action);
                const { draftKey, canonicalKey } = mapping;
                const expiration = Date.now() + MAPPING_TTL;
                const entryKey = createDraftMappingEntryKey(draftKey, canonicalKey);
                return this.durableStore.setEntries(
                    {
                        [entryKey]: {
                            data: mapping,
                            expiration: { fresh: expiration, stale: expiration },
                        },
                    },
                    DRAFT_ID_MAPPINGS_SEGMENT
                );
            });
    }

    /**
     * Executes a batch of queue operations
     * @param queueOperations list of queue operations to execute
     */
    private executeBatchedQueueOperations(queueOperations: QueueOperation[]): Promise<void> {
        // TODO convert queueOperations to a batched durable store operation when available
        const setEntries: DurableStoreEntries = {};
        const evictEntries: string[] = [];
        for (let i = 0, len = queueOperations.length; i < len; i++) {
            const operation = queueOperations[i];
            if (operation.type === QueueOperationType.Delete) {
                evictEntries.push(operation.key);
            } else {
                let key = '';
                if (operation.type === QueueOperationType.Add) {
                    key = buildDraftDurableStoreKey(operation.action.tag, operation.action.id);
                } else {
                    key = operation.key;
                }
                setEntries[key] = { data: operation.action };
            }
        }

        return this.durableStore
            .setEntries(setEntries, DRAFT_SEGMENT)
            .then(() => this.durableStore.evictEntries(evictEntries, DRAFT_SEGMENT));
    }
}
