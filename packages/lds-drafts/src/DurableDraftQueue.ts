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
    DraftIdMappingEntry,
    DraftActionMetadata,
    Action,
    isDraftError,
} from './DraftQueue';
import { NetworkAdapter, FetchResponse } from '@luvio/engine';
import { ObjectKeys } from './utils/language';
import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import { buildDraftDurableStoreKey } from './utils/records';
import { CustomActionExecutor, customActionHandler } from './actionHandlers/CustomActionHandler';
import {
    isLDSDraftAction,
    ldsActionHandler,
    LDS_ACTION_HANDLER_ID,
} from './actionHandlers/LDSActionHandler';
import { ActionHandler } from './actionHandlers/ActionHandler';

export const DRAFT_SEGMENT = 'DRAFT';
export const DRAFT_ID_MAPPINGS_SEGMENT = 'DRAFT_ID_MAPPINGS';

/**
 * Returns an array of keys for DraftActions that should be deleted, since the draft-create that they
 * are related to is being deleted.
 */
function getRelatedDraftKeysForDelete(
    deletedAction: DraftAction<unknown, unknown>,
    queue: DraftAction<unknown, unknown>[]
): string[] {
    const relatedKeysToDelete: string[] = [];
    // only look to delete related drafts of deleted draft-creates
    if (isLDSDraftAction(deletedAction)) {
        if (deletedAction.data.method !== 'post') {
            return relatedKeysToDelete;
        }
        const deletedActionTargetId = deletedAction.targetId;
        const { length } = queue;

        for (let i = 0; i < length; i++) {
            const queueAction = queue[i];
            const { tag, id, targetId } = queueAction;
            // a related draft action needs to be set for deletion if its targetId is the same as the
            // deleted action's targetId.  Also check that the queueAction is not the deletedAction itself.
            const needsDelete = targetId === deletedActionTargetId && queueAction !== deletedAction;

            if (needsDelete) {
                const draftKey = buildDraftDurableStoreKey(tag, id);
                relatedKeysToDelete.push(draftKey);
            }
        }
    }

    return relatedKeysToDelete;
}

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
            throw new Error('Unable to generate unique new draft ID');
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

/**
 * Extracts a mapping of a draft key to a canonical key given a completed draft action
 */
export type CreateDraftIdMappingHandler = (
    completedPost: CompletedDraftAction<unknown, unknown>
) => DraftIdMappingEntry;

export class DurableDraftQueue implements DraftQueue {
    private retryIntervalMilliseconds: number = 0;
    private minimumRetryInterval: number = 250;
    private maximumRetryInterval: number = 32000;
    private durableStore: DurableStore;
    private draftQueueChangedListeners: DraftQueueChangeListener[] = [];
    private state = DraftQueueState.Stopped;
    private userState = DraftQueueState.Stopped;
    private processingAction?: Promise<ProcessActionResult>;
    private replacingAction?: Promise<DraftAction<unknown, unknown>>;
    private uploadingActionId?: String = undefined;

    private handlers: { [id: string]: ActionHandler<unknown> } = {};

    constructor(
        store: DurableStore,
        network: NetworkAdapter,
        updateQueueOnPostCompletion: QueuePostHandler,
        createDraftIdMapping: CreateDraftIdMappingHandler
    ) {
        this.durableStore = store;

        this.addHandler(
            LDS_ACTION_HANDLER_ID,
            ldsActionHandler(
                network,
                updateQueueOnPostCompletion,
                createDraftIdMapping,
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
        return this.durableStore
            .getAllEntries<DraftAction<unknown, unknown>>(DRAFT_SEGMENT)
            .then((durableEntries) => {
                const queue: DraftAction<unknown, unknown>[] = [];
                if (durableEntries === undefined) {
                    return queue;
                }
                const keys = ObjectKeys(durableEntries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const entry = durableEntries[keys[i]];
                    if (entry.data.id === this.uploadingActionId) {
                        entry.data.status = DraftActionStatus.Uploading;
                    }
                    queue.push(entry.data);
                }

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

    enqueue<Response, Data>(action: Action<Data>): Promise<DraftAction<Response, Data>> {
        return this.getQueueActions().then((queue) => {
            const handler = this.handlers[action.handler] as ActionHandler<Data>;
            if (handler === undefined) {
                return Promise.reject(`No handler for ${action.handler}`);
            }

            const pendingAction = handler.buildPendingAction(action, queue);
            const { tag, id } = pendingAction;
            const durableStoreId = buildDraftDurableStoreKey(tag, id);

            const entry: DurableStoreEntry<DraftAction<Response, Data>> = { data: pendingAction };
            const entries: DurableStoreEntries<DraftAction<Response, Data>> = {
                [durableStoreId]: entry,
            };
            this.notifyChangedListeners({
                type: DraftQueueEventType.ActionAdding,
                action: pendingAction,
            });
            return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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
            .then((queue) =>
                this.handlers[action.handler].storeOperationsForUploadedDraft(queue, action)
            )
            .then((operations) => this.durableStore.batchOperations(operations))
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
            const { id, tag } = action;
            const durableEntryKey = buildDraftDurableStoreKey(tag, id);
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
            const entry: DurableStoreEntry<DraftAction<unknown, unknown>> = {
                data: errorAction,
            };
            const entries: DurableStoreEntries<DraftAction<unknown, unknown>> = {
                [durableEntryKey]: entry,
            };
            return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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
                throw new Error(`No removable action with id ${actionId}`);
            }

            const action = actions[0];
            if (action.id === this.uploadingActionId) {
                throw new Error(`Cannot remove an uploading draft action with ID ${actionId}`);
            }

            let durableStoreKey = buildDraftDurableStoreKey(action.tag, action.id);
            // array of draft action to delete, and all related actions
            let allRelatedDraftKeysToDelete = getRelatedDraftKeysForDelete(action, queue).concat(
                durableStoreKey
            );

            return this.notifyChangedListeners({
                type: DraftQueueEventType.ActionDeleting,
                action,
            })
                .then(() => {
                    return this.durableStore
                        .evictEntries(allRelatedDraftKeysToDelete, DRAFT_SEGMENT)
                        .then(() => {
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

                // TODO: W-8873834 - Will add batching support to durable store
                // we should use that here to remove and set both actions in one operation
                return this.removeDraftAction(replacingAction.id).then(() => {
                    const entry: DurableStoreEntry<PendingDraftAction<unknown, unknown>> = {
                        data: actionToReplace as PendingDraftAction<unknown, unknown>,
                    };
                    const durableEntryKey = buildDraftDurableStoreKey(
                        actionToReplace.tag,
                        actionToReplace.id
                    );
                    const entries: DurableStoreEntries<PendingDraftAction<unknown, unknown>> = {
                        [durableEntryKey]: entry,
                    };
                    return this.notifyChangedListeners({
                        type: DraftQueueEventType.ActionUpdating,
                        action: original,
                    }).then(() => {
                        return this.durableStore.setEntries(entries, DRAFT_SEGMENT).then(() => {
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
                action.metadata = metadata;
                const durableStoreId = buildDraftDurableStoreKey(action.tag, action.id);
                const entry: DurableStoreEntry<DraftAction<unknown, unknown>> = { data: action };
                const entries: DurableStoreEntries<DraftAction<unknown, unknown>> = {
                    [durableStoreId]: entry,
                };
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
}
