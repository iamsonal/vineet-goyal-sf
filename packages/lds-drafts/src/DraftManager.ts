import { CustomActionResult } from './actionHandlers/CustomActionHandler';
import { isLDSDraftAction } from './actionHandlers/LDSActionHandler';
import {
    DraftActionStatus,
    DraftQueue,
    DraftAction,
    isDraftError,
    DraftQueueState,
    DraftQueueEvent,
    DraftQueueEventType,
    DraftActionMetadata,
} from './DraftQueue';
import { ArrayIsArray, JSONStringify } from './utils/language';

/**
 * Representation of the current state of the draft queue.
 * Includes the overall state as well as a list of draft
 * items that are currently in the queue.
 */
export interface DraftManagerState {
    queueState: DraftQueueState;
    items: DraftQueueItem[];
}

export type DraftQueueItemMetadata = { [key: string]: string };
export type DraftManagerCustomActionExecutor = (
    item: DraftQueueItem,
    completed: (result: CustomActionResult) => void
) => void;

/**
 * An item in the draft queue that loosely maps to
 * a DraftAction
 */
export interface DraftQueueItem {
    /** The id of the Draft Action Item */
    id: string;
    /** The unique id of the target item */
    targetId?: string;
    /** The current status of this item */
    state: DraftActionStatus;
    /** The type of operation this item represents */
    operationType: DraftActionOperationType;
    /** Timestamp as unix epoch time */
    timestamp: number;
    /** undefined unless item is in an error state */
    error?: undefined | DraftQueueItemError;
    /** The stored metadata for the draft queue item */
    metadata: DraftQueueItemMetadata;
}

/**
 * An error of a draft action that was submitted and failed
 */
export interface DraftQueueItemError {
    /** The status code of the response */
    status: number;
    /** The headers of the response */
    headers: { [key: string]: string };
    /** A flag representing the status of the response */
    ok: boolean;
    /** A summary of the response */
    statusText: string;
    /** A stringified object representing the body of the response */
    bodyString: string;
}

/**
 * Denotes what kind of operation a DraftQueueItem represents.
 */
export enum DraftActionOperationType {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
    Custom = 'custom',
}

export enum DraftQueueOperationType {
    ItemAdded = 'added',
    ItemDeleted = 'deleted',
    ItemCompleted = 'completed',
    ItemFailed = 'failed',
    ItemUpdated = 'updated',
}

/**
 * A closure that draft queue change listeners pass to
 * receive updates when the draft queue changes.
 */
export declare type DraftQueueListener = (
    state: DraftManagerState,
    operationType: DraftQueueOperationType,
    queueItem: DraftQueueItem
) => void;

/**
 * Converts the internal DraftAction's ResourceRequest into
 * a DraftActionOperationType.
 * Returns a DraftActionOperationType as long as the http request is a
 * valid method type for DraftQueue or else it is undefined.
 * @param action
 */
function getOperationTypeFrom(action: DraftAction<unknown, unknown>): DraftActionOperationType {
    if (isLDSDraftAction(action)) {
        if (action.data !== undefined && action.data.method !== undefined) {
            switch (action.data.method) {
                case 'put':
                case 'patch':
                    return DraftActionOperationType.Update;
                case 'post':
                    return DraftActionOperationType.Create;
                case 'delete':
                    return DraftActionOperationType.Delete;
                default:
                    // eslint-disable-next-line @salesforce/lds/no-error-in-production
                    throw new Error(
                        `${action.data.method} is an unsupported request method type for DraftQueue.`
                    );
            }
        } else {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error(`action has no data found`);
        }
    } else {
        return DraftActionOperationType.Custom;
    }
}

function toQueueState(queue: DraftQueue): (states: DraftQueueItem[]) => DraftManagerState {
    return (states) => {
        return {
            queueState: queue.getQueueState(),
            items: states,
        };
    };
}

export class DraftManager {
    private draftQueue: DraftQueue;
    private listeners: DraftQueueListener[] = [];
    constructor(draftQueue: DraftQueue) {
        this.draftQueue = draftQueue;

        draftQueue.registerOnChangedListener((event: DraftQueueEvent): Promise<void> => {
            if (this.shouldEmitDraftEvent(event)) {
                return this.callListeners(event);
            }
            return Promise.resolve();
        });
    }

    private shouldEmitDraftEvent(event: DraftQueueEvent) {
        const { type } = event;
        return (
            type === DraftQueueEventType.ActionAdded ||
            type === DraftQueueEventType.ActionCompleted ||
            type === DraftQueueEventType.ActionDeleted ||
            type === DraftQueueEventType.ActionFailed ||
            type === DraftQueueEventType.ActionUpdated
        );
    }

    private draftQueueEventTypeToOperationType(type: DraftQueueEventType): DraftQueueOperationType {
        switch (type) {
            case DraftQueueEventType.ActionAdded:
                return DraftQueueOperationType.ItemAdded;
            case DraftQueueEventType.ActionCompleted:
                return DraftQueueOperationType.ItemCompleted;
            case DraftQueueEventType.ActionDeleted:
                return DraftQueueOperationType.ItemDeleted;
            case DraftQueueEventType.ActionFailed:
                return DraftQueueOperationType.ItemFailed;
            case DraftQueueEventType.ActionUpdated:
                return DraftQueueOperationType.ItemUpdated;
            default:
                throw Error('Unsupported event type');
        }
    }

    /**
     * Enqueue a custom action on the DraftQueue for a handler
     * @param handler the handler's id
     * @param targetId
     * @param tag - the key to group with in durable store
     * @param metadata
     * @returns
     */
    addCustomAction(
        handler: string,
        targetId: string,
        tag: string,
        metadata: DraftActionMetadata
    ): Promise<DraftQueueItem> {
        return this.draftQueue
            .enqueue({
                data: metadata,
                handler,
                targetId,
                targetApiName: undefined,
                tag,
            })
            .then(this.buildDraftQueueItem);
    }

    /**
     * Get the current state of each of the DraftActions in the DraftQueue
     * @returns A promise of an array of the state of each item in the DraftQueue
     */
    getQueue(): Promise<DraftManagerState> {
        return this.draftQueue
            .getQueueActions()
            .then((queueActions) => {
                return queueActions.map(this.buildDraftQueueItem);
            })
            .then(toQueueState(this.draftQueue));
    }

    /**
     * Starts the draft queue and begins processing the first item in the queue.
     */
    startQueue(): Promise<void> {
        return this.draftQueue.startQueue();
    }

    /**
     * Stops the draft queue from processing more draft items after any current
     * in progress items are finished.
     */
    stopQueue(): Promise<void> {
        return this.draftQueue.stopQueue();
    }

    /**
     * Subscribes the listener to changes to the draft queue.
     *
     * Returns a closure to invoke in order to unsubscribe the listener
     * from changes to the draft queue.
     *
     * @param listener The listener closure to subscribe to changes
     */
    registerDraftQueueChangedListener(listener: DraftQueueListener): () => Promise<void> {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => {
                return l !== listener;
            });
            return Promise.resolve();
        };
    }

    /**
     * Creates a custom action handler for the given handler
     * @param handlerId
     * @param executor
     * @returns
     */
    setCustomActionExecutor(
        handlerId: string,
        executor: DraftManagerCustomActionExecutor
    ): Promise<() => Promise<void>> {
        return this.draftQueue
            .addCustomHandler(handlerId, (action, completed) => {
                executor(this.buildDraftQueueItem(action), completed);
            })
            .then(() => {
                return () => {
                    this.draftQueue.removeHandler(handlerId);
                    return Promise.resolve();
                };
            });
    }

    private buildDraftQueueItem(action: DraftAction<unknown, unknown>): DraftQueueItem {
        const operationType = getOperationTypeFrom(action);
        const { id, status, timestamp, targetId, metadata } = action;
        const item: DraftQueueItem = {
            id,
            targetId,
            state: status,
            timestamp,
            operationType,
            metadata,
        };
        if (isDraftError(action)) {
            // We should always return an array, if the body is just a dictionary,
            // stick it in an array
            const body = ArrayIsArray(action.error.body) ? action.error.body : [action.error.body];
            const bodyString = JSONStringify(body);
            item.error = {
                status: action.error.status || 0,
                ok: action.error.ok || false,
                headers: action.error.headers || {},
                statusText: action.error.statusText || '',
                bodyString,
            };
        }
        return item;
    }

    private callListeners(event: DraftQueueEvent): Promise<void> {
        return this.getQueue().then((queueState) => {
            const { action, type } = event;
            const item = this.buildDraftQueueItem(action);
            const operationType = this.draftQueueEventTypeToOperationType(type);
            for (let i = 0, len = this.listeners.length; i < len; i++) {
                const listener = this.listeners[i];
                listener(queueState, operationType, item);
            }
        });
    }

    /**
     * Removes the draft action identified by actionId from the draft queue.
     *
     * @param actionId The action identifier
     *
     * @returns The current state of the draft queue
     */
    removeDraftAction(actionId: string): Promise<DraftManagerState> {
        return this.draftQueue.removeDraftAction(actionId).then(() => this.getQueue());
    }

    /**
     * Replaces the resource request of `withAction` for the resource request
     * of `actionId`. Action ids cannot be equal. Both actions must be acting
     * on the same target object, and neither can currently be in progress.
     *
     * @param actionId The id of the draft action to replace
     * @param withActionId The id of the draft action that will replace the other
     */
    replaceAction(actionId: string, withActionId: string): Promise<DraftQueueItem> {
        return this.draftQueue.replaceAction(actionId, withActionId).then((replaced) => {
            return this.buildDraftQueueItem(replaced);
        });
    }

    /**
     * Sets the metadata object of the specified action to the
     * provided metadata
     * @param actionId The id of the action to set the metadata on
     * @param metadata The metadata to set on the specified action
     */
    setMetadata(actionId: string, metadata: DraftQueueItemMetadata): Promise<DraftQueueItem> {
        return this.draftQueue.setMetadata(actionId, metadata).then((updatedAction) => {
            return this.buildDraftQueueItem(updatedAction);
        });
    }
}
