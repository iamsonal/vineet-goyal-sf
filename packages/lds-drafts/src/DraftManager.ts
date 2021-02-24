import {
    DraftActionStatus,
    DraftQueue,
    DraftAction,
    isDraftError,
    DraftQueueState,
    DraftQueueEvent,
    DraftQueueEventType,
} from './DraftQueue';

/**
 * Representation of the current state of the draft queue.
 * Includes the overall state as well as a list of draft
 * items that are currently in the queue.
 */
export interface DraftManagerState {
    queueState: DraftQueueState;
    items: DraftQueueItem[];
}

/**
 * An item in the draft queue that loosely maps to
 * a DraftAction
 */
export interface DraftQueueItem {
    /** The id of the Draft Action Item */
    id: string;
    state: DraftActionStatus;
    operationType: DraftActionOperationType;
    /** Timestamp as unix epoch time */
    timestamp: number;
    /** undefined unless item is in an error state */
    error?: undefined | any;
}

/**
 * Denotes what kind of operation a DraftQueueItem represents.
 */
export enum DraftActionOperationType {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
}

export enum DraftQueueOperationType {
    ItemAdded = 'added',
    ItemDeleted = 'deleted',
    ItemCompleted = 'completed',
    ItemFailed = 'failed',
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
function getOperationTypeFrom(action: DraftAction<unknown>): DraftActionOperationType {
    switch (action.request.method) {
        case 'put':
        case 'patch':
            return DraftActionOperationType.Update;
        case 'post':
            return DraftActionOperationType.Create;
        case 'delete':
            return DraftActionOperationType.Delete;
        default:
            throw new Error(
                `${action.request.method} is an unsupported request method type for DraftQueue.`
            );
    }
}

function toQueueState(queue: DraftQueue): (states: DraftQueueItem[]) => DraftManagerState {
    return states => {
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

        draftQueue.registerOnChangedListener(
            (event: DraftQueueEvent): Promise<void> => {
                if (this.shouldEmitDraftEvent(event)) {
                    return this.callListeners(event);
                }
                return Promise.resolve();
            }
        );
    }

    private shouldEmitDraftEvent(event: DraftQueueEvent) {
        const { type } = event;
        return (
            type === DraftQueueEventType.ActionAdded ||
            type === DraftQueueEventType.ActionCompleted ||
            type === DraftQueueEventType.ActionDeleted ||
            type === DraftQueueEventType.ActionFailed
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
            default:
                throw Error('Unsupported event type');
        }
    }

    /**
     * Get the current state of each of the DraftActions in the DraftQueue
     * @returns A promise of an array of the state of each item in the DraftQueue
     */
    getQueue(): Promise<DraftManagerState> {
        return this.draftQueue
            .getQueueActions()
            .then(queueActions => {
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
            this.listeners = this.listeners.filter(l => {
                return l !== listener;
            });
            return Promise.resolve();
        };
    }

    private buildDraftQueueItem(action: DraftAction<unknown>): DraftQueueItem {
        const operationType = getOperationTypeFrom(action);
        const { id, status, timestamp } = action;
        const item: DraftQueueItem = {
            id,
            state: status,
            timestamp,
            operationType,
        };
        if (isDraftError(action)) {
            item.error = action.error;
        }
        return item;
    }

    private callListeners(event: DraftQueueEvent): Promise<void> {
        return this.getQueue().then(queueState => {
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
        return this.draftQueue.replaceAction(actionId, withActionId).then(replaced => {
            return this.buildDraftQueueItem(replaced);
        });
    }
}
