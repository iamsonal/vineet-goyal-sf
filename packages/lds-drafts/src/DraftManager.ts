import {
    DraftActionStatus,
    DraftQueue,
    DraftAction,
    isDraftError,
    DraftQueueState,
} from './DraftQueue';

export interface DraftQueueManager {
    queueState: DraftQueueState;
    items: DraftQueueItem[];
}

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

export enum DraftActionOperationType {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
}

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

function toQueueState(queue: DraftQueue): (states: DraftQueueItem[]) => DraftQueueManager {
    return states => {
        return {
            queueState: queue.getQueueState(),
            items: states,
        };
    };
}

export class DraftManager {
    private draftQueue: DraftQueue;

    constructor(draftQueue: DraftQueue) {
        this.draftQueue = draftQueue;
    }

    /**
     * Get the current state of each of the DraftActions in the DraftQueue
     * @returns A promise of an array of the state of each item in the DraftQueue
     */
    getCurrentDraftQueueState(): Promise<DraftQueueManager> {
        return this.draftQueue
            .getQueueActions()
            .then(queueActions => {
                return queueActions.map(action => {
                    const operationType = getOperationTypeFrom(action);
                    const item: DraftQueueItem = {
                        id: action.id,
                        state: action.status,
                        timestamp: action.timestamp,
                        operationType: operationType,
                    };
                    if (isDraftError(action)) {
                        item.error = action.error;
                    }
                    return item;
                });
            })
            .then(toQueueState(this.draftQueue));
    }
}
