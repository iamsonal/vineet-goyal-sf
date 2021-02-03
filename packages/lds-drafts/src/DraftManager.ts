import {
    DraftActionStatus,
    DraftQueue,
    DraftAction,
    isDraftError,
    DraftQueueState,
    CompletedDraftAction,
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

/**
 * A closure that draft queue change listeners pass to
 * receive updates when the draft queue changes.
 *
 * Includes the current state of the draft queue and the
 * DraftQueueItem that was removed from the queue if the
 * current change is a draft action that completed.
 */
export declare type DraftQueueListener = (
    state: DraftManagerState,
    completed?: DraftQueueItem
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
            (completed?: CompletedDraftAction<unknown>): Promise<void> => {
                return this.callListeners(completed);
            }
        );
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

    private callListeners(completed?: CompletedDraftAction<unknown>): Promise<void> {
        return this.getQueue().then(queueState => {
            let item: DraftQueueItem | undefined;
            if (completed !== undefined) {
                item = this.buildDraftQueueItem(completed);
            }
            for (let i = 0, len = this.listeners.length; i < len; i++) {
                const listener = this.listeners[i];
                listener(queueState, item);
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
}
