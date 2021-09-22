import {
    DraftQueue,
    DraftAction,
    CompletedDraftAction,
    PendingDraftAction,
    ErrorDraftAction,
    DraftActionMap,
    DraftActionStatus,
    ProcessActionResult,
    DraftQueueState,
    DraftQueueChangeListener,
    DraftQueueEvent,
    DraftQueueEventType,
    UploadingDraftAction,
    QueueOperation,
    DraftActionMetadata,
    Action,
    isDraftError,
    LDSAction,
} from './DraftQueue';
import { NetworkAdapter, FetchResponse } from '@luvio/engine';
import { ObjectKeys } from './utils/language';
import { CustomActionExecutor, customActionHandler } from './actionHandlers/CustomActionHandler';
import {
    isLDSDraftAction,
    ldsActionHandler,
    LDS_ACTION_HANDLER_ID,
    LDS_ACTION_METADATA_API_NAME,
} from './actionHandlers/LDSActionHandler';
import { ActionHandler } from './actionHandlers/ActionHandler';
import { DraftStore } from './DraftStore';

export const DRAFT_SEGMENT = 'DRAFT';
export const DRAFT_ID_MAPPINGS_SEGMENT = 'DRAFT_ID_MAPPINGS';

/**
 * Generates a time-ordered, unique id to associate with a DraftAction. Ensures
 * no collisions with existing draft action IDs.
 */
export function generateUniqueDraftActionId(existingIds: string[]) {
    // new id in milliseconds with some extra digits for collisions
    let newId = new Date().getTime() * 100;

    const existingAsNumbers = existingIds
        .map((id) => parseInt(id, 10))
        .filter((parsed) => !isNaN(parsed));

    let counter = 0;
    while (existingAsNumbers.includes(newId)) {
        newId += 1;
        counter += 1;

        // if the counter is 100+ then somehow this method has been called 100
        // times in one millisecond
        if (counter >= 100) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Unable to generate unique new draft ID');
            }
        }
    }

    return newId.toString();
}

/**
 * Returns a list of queue actions that should be taken after a POST action is successfully
 * uploaded
 */
export type QueuePostHandler = (
    completedPost: CompletedDraftAction<unknown, unknown>,
    queue: DraftAction<unknown, unknown>[]
) => QueueOperation[];

export class DurableDraftQueue implements DraftQueue {
    private retryIntervalMilliseconds: number = 0;
    private minimumRetryInterval: number = 250;
    private maximumRetryInterval: number = 32000;
    private draftStore: DraftStore;
    private draftQueueChangedListeners: DraftQueueChangeListener[] = [];
    private state = DraftQueueState.Stopped;
    private userState = DraftQueueState.Stopped;
    private processingAction?: Promise<ProcessActionResult>;
    private replacingAction?: Promise<DraftAction<unknown, unknown>>;
    private uploadingActionId?: String = undefined;

    private handlers: { [id: string]: ActionHandler<unknown> } = {};

    constructor(
        draftStore: DraftStore,
        network: NetworkAdapter,
        updateQueueOnPostCompletion: QueuePostHandler
    ) {
        this.draftStore = draftStore;

        this.addHandler(
            LDS_ACTION_HANDLER_ID,
            ldsActionHandler(
                network,
                updateQueueOnPostCompletion,
                this.actionCompleted.bind(this),
                this.actionFailed.bind(this)
            )
        );
    }

    addHandler<Data>(id: string, handler: ActionHandler<Data>) {
        if (this.handlers[id] !== undefined) {
            return Promise.reject(`Unable to add handler to id: ${id} because it already exists.`);
        }
        this.handlers[id] = handler;
        return Promise.resolve();
    }

    removeHandler(id: string) {
        delete this.handlers[id];
        return Promise.resolve();
    }

    addCustomHandler(id: string, executor: CustomActionExecutor) {
        const handler = customActionHandler(
            executor,
            this.actionCompleted.bind(this),
            this.actionFailed.bind(this)
        );
        return this.addHandler(id, handler);
    }

    getQueueState(): DraftQueueState {
        return this.state;
    }

    startQueue(): Promise<void> {
        this.userState = DraftQueueState.Started;
        if (this.state === DraftQueueState.Started) {
            return Promise.resolve();
        }
        if (this.replacingAction !== undefined) {
            // If we're replacing an action do nothing
            // replace will restart the queue for us as long as the user
            // has last set the queue to be started
            return Promise.resolve();
        }
        this.state = DraftQueueState.Started;
        this.retryIntervalMilliseconds = 0;
        return this.processNextAction().then((result) => {
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
        this.userState = DraftQueueState.Stopped;
        return this.stopQueueManually();
    }

    /**
     * Used to stop the queue within DraftQueue without user interaction
     * @returns
     */
    private stopQueueManually(): Promise<void> {
        this.state = DraftQueueState.Stopped;
        return Promise.resolve();
    }

    getQueueActions(): Promise<DraftAction<unknown, unknown>[]> {
        return this.draftStore.getAllDrafts().then((drafts) => {
            const queue: DraftAction<unknown, unknown>[] = [];
            if (drafts === undefined) {
                return queue;
            }

            drafts.forEach((draft) => {
                if (draft.id === this.uploadingActionId) {
                    draft.status = DraftActionStatus.Uploading;
                }
                queue.push(draft);
            });

            const sortedQueue = queue.sort((a, b) => {
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
            return sortedQueue;
        });
    }

    enqueue<Response, Data>(
        action: Action<Data> | LDSAction<Data>
    ): Promise<DraftAction<Response, Data>> {
        return this.getQueueActions().then((queue) => {
            const handler = this.handlers[action.handler] as ActionHandler<Data>;
            if (handler === undefined) {
                return Promise.reject(`No handler for ${action.handler}`);
            }

            const pendingAction = handler.buildPendingAction(action, queue);

            this.notifyChangedListeners({
                type: DraftQueueEventType.ActionAdding,
                action: pendingAction,
            });
            return this.draftStore.writeAction(pendingAction).then(() => {
                this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionAdded,
                    action: pendingAction,
                });
                if (this.state === DraftQueueState.Started) {
                    this.processNextAction();
                }
                return pendingAction;
            });
        });
    }

    getActionsForTags(tags: Record<string, true>): Promise<DraftActionMap> {
        return this.getQueueActions().then((queue) => {
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
            this.draftQueueChangedListeners = this.draftQueueChangedListeners.filter((l) => {
                return l !== listener;
            });
            return Promise.resolve();
        };
    }

    actionCompleted(action: CompletedDraftAction<unknown, unknown>) {
        // notify that consumers that this action is completed and about to be removed from the draft queue
        return this.notifyChangedListeners({
            type: DraftQueueEventType.ActionCompleting,
            action,
        })
            .then(() => this.getQueueActions())
            .then((queue) => {
                const handler = this.handlers[action.handler];
                const queueOperations = handler.queueOperationsForCompletedDraft(queue, action);
                const mapping = handler.getRedirectMapping(action);
                return this.draftStore.completeAction(queueOperations, mapping);
            })
            .then(() => {
                this.retryIntervalMilliseconds = 0;
                this.uploadingActionId = undefined;
                // process action success
                return this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionCompleted,
                    action,
                }).then(() => {
                    if (this.state === DraftQueueState.Started) {
                        this.processNextAction();
                    }
                });
            });
    }

    actionFailed(action: DraftAction<unknown, unknown>, retry: boolean) {
        this.uploadingActionId = undefined;
        if (retry) {
            this.state = DraftQueueState.Waiting;
            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionRetrying,
                action: action as PendingDraftAction<unknown, unknown>,
            }).then(() => {
                this.scheduleRetry();
            });
        } else if (isDraftError(action)) {
            return this.handleServerError(action, action.error);
        }
        return Promise.resolve();
    }

    handle(action: DraftAction<unknown, unknown>): Promise<ProcessActionResult> {
        const handler = this.handlers[action.handler];
        if (handler === undefined) {
            return Promise.reject(`No handler for ${action.handler}.`);
        }
        return handler.handle(action);
    }

    processNextAction(): Promise<ProcessActionResult> {
        if (this.processingAction !== undefined) {
            return this.processingAction;
        }
        this.processingAction = this.getQueueActions().then((queue) => {
            const action = queue[0];
            if (action === undefined) {
                this.processingAction = undefined;
                return ProcessActionResult.NO_ACTION_TO_PROCESS;
            }
            const { status, id } = action;

            if (status === DraftActionStatus.Error) {
                this.state = DraftQueueState.Error;
                this.processingAction = undefined;
                return ProcessActionResult.BLOCKED_ON_ERROR;
            }

            if (id === this.uploadingActionId) {
                this.state = DraftQueueState.Started;
                this.processingAction = undefined;
                return ProcessActionResult.ACTION_ALREADY_PROCESSING;
            }

            this.uploadingActionId = id;
            this.processingAction = undefined;

            if (this.state === DraftQueueState.Waiting) {
                this.state = DraftQueueState.Started;
            }

            this.notifyChangedListeners({
                type: DraftQueueEventType.ActionRunning,
                action: action as UploadingDraftAction<unknown, unknown>,
            });

            return this.handle(action);
        });
        return this.processingAction;
    }

    private handleServerError(
        action: DraftAction<unknown, unknown>,
        error: FetchResponse<unknown>
    ): Promise<void> {
        return this.getQueueActions().then((queue) => {
            const localAction = queue.filter((qAction) => qAction.id === action.id)[0];
            let newMetadata = {};
            if (localAction !== undefined) {
                newMetadata = localAction.metadata || {};
            }

            const errorAction: ErrorDraftAction<unknown, unknown> = {
                ...action,
                status: DraftActionStatus.Error,
                error,
                metadata: newMetadata,
            };

            return this.draftStore.writeAction(errorAction).then(() => {
                this.state = DraftQueueState.Error;
                return this.notifyChangedListeners({
                    type: DraftQueueEventType.ActionFailed,
                    action: errorAction,
                });
            });
        });
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
        return this.getQueueActions().then((queue) => {
            //Get the store key for the removed action
            const actions = queue.filter((action) => action.id === actionId);
            if (actions.length === 0) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error(`No removable action with id ${actionId}`);
                }
            }

            const action = actions[0];
            if (action.id === this.uploadingActionId) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error(`Cannot remove an uploading draft action with ID ${actionId}`);
                }
            }

            const shouldDeleteRelated = isLDSDraftAction(action) && action.data.method === 'post';

            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionDeleting,
                action,
            })
                .then(() => {
                    const deleteAction = shouldDeleteRelated
                        ? this.draftStore.deleteByTag(action.tag)
                        : this.draftStore.deleteDraft(action.id);

                    return deleteAction.then(() => {
                        this.notifyChangedListeners({
                            type: DraftQueueEventType.ActionDeleted,
                            action,
                        });
                    });
                })
                .then(() => {
                    if (
                        this.userState === DraftQueueState.Started &&
                        this.state !== DraftQueueState.Started &&
                        this.replacingAction === undefined
                    ) {
                        this.startQueue();
                    }
                });
        });
    }

    replaceAction(actionId: string, withActionId: string): Promise<DraftAction<unknown, unknown>> {
        // ids must be unique
        if (actionId === withActionId) {
            return Promise.reject('Swapped and swapping action ids cannot be the same');
        }
        // cannot have a replace action already in progress
        if (this.replacingAction !== undefined) {
            return Promise.reject('Cannot replace actions while a replace action is in progress');
        }
        return this.stopQueueManually().then(() => {
            const replacing = this.getQueueActions().then((actions) => {
                const first = actions.filter((action) => action.id === actionId)[0];
                if (first === undefined) {
                    return Promise.reject('No action to replace');
                }

                const { original, actionToReplace, replacingAction } = this.handlers[
                    first.handler
                ].replaceAction(actionId, withActionId, this.uploadingActionId, actions);

                // TODO [W-8873834]: Will add batching support to durable store
                // we should use that here to remove and set both actions in one operation
                return this.removeDraftAction(replacingAction.id).then(() => {
                    return this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionUpdating,
                        action: original,
                    }).then(() => {
                        return this.draftStore.writeAction(actionToReplace).then(() => {
                            return this.notifyChangedListeners({
                                type: DraftQueueEventType.ActionUpdated,
                                action: actionToReplace,
                            }).then(() => {
                                this.replacingAction = undefined;
                                if (
                                    this.userState === DraftQueueState.Started &&
                                    this.state !== DraftQueueState.Started
                                ) {
                                    return this.startQueue().then(() => {
                                        return actionToReplace;
                                    });
                                } else {
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

    setMetadata(
        actionId: string,
        metadata: DraftActionMetadata
    ): Promise<DraftAction<unknown, unknown>> {
        const keys = ObjectKeys(metadata);
        const compatibleKeys = keys.filter((key): boolean => {
            const value = metadata[key];
            return typeof key === 'string' && typeof value === 'string';
        });
        if (keys.length !== compatibleKeys.length) {
            return Promise.reject('Cannot save incompatible metadata');
        }
        return this.getQueueActions().then((queue) => {
            const actions = queue.filter((action) => action.id === actionId);
            if (actions.length === 0) {
                return Promise.reject('cannot save metadata to non-existent action');
            }

            const action = actions[0];
            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionUpdating,
                action: action,
            }).then(() => {
                action.metadata = this.sanitizeMetadata(action.metadata, metadata);

                return this.draftStore.writeAction(action).then(() => {
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

    private sanitizeMetadata(
        existing: DraftActionMetadata,
        newMetadata: DraftActionMetadata
    ): DraftActionMetadata {
        let sanitized = newMetadata;
        sanitized[LDS_ACTION_METADATA_API_NAME] = existing[LDS_ACTION_METADATA_API_NAME];
        return sanitized;
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
