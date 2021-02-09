import { ResourceRequest, FetchResponse } from '@luvio/engine';

export enum DraftActionStatus {
    Pending = 'pending',
    Uploading = 'uploading',
    Error = 'error',
    Completed = 'completed',
}
interface BaseDraftAction<T> {
    status: DraftActionStatus;
    id: string;
    tag: string;
    request: ResourceRequest;
    /** Timestamp as unix epoch time */
    timestamp: number;
}

export interface CompletedDraftAction<T> extends BaseDraftAction<T> {
    status: DraftActionStatus.Completed;
    response: FetchResponse<T>;
}

export interface PendingDraftAction<T> extends BaseDraftAction<T> {
    status: DraftActionStatus.Pending;
}

export interface ErrorDraftAction<T> extends BaseDraftAction<T> {
    status: DraftActionStatus.Error;
    error: any;
}

export interface UploadingDraftAction<T> extends BaseDraftAction<T> {
    status: DraftActionStatus.Uploading;
}

export function isDraftCompleted<T>(draft: BaseDraftAction<T>): draft is CompletedDraftAction<T> {
    return draft.status === DraftActionStatus.Completed;
}

export function isDraftError<T>(draft: BaseDraftAction<T>): draft is ErrorDraftAction<T> {
    return draft.status === DraftActionStatus.Error;
}

export type DraftAction<T> =
    | CompletedDraftAction<T>
    | PendingDraftAction<T>
    | ErrorDraftAction<T>
    | UploadingDraftAction<T>;

export type DraftQueueChangeListener = (event: DraftQueueEvent) => Promise<void>;

export type DraftActionMap = { [tag: string]: Readonly<DraftAction<unknown>>[] };

export enum ProcessActionResult {
    // non-2xx network error, requires user intervention
    ACTION_ERRORED = 'ERROR',

    // upload succeeded
    ACTION_SUCCEEDED = 'SUCCESS',

    // queue is empty
    NO_ACTION_TO_PROCESS = 'NO_ACTION_TO_PROCESS',

    // network request is in flight
    ACTION_ALREADY_PROCESSING = 'ACTION_ALREADY_PROCESSING',

    // network call failed (offline)
    NETWORK_ERROR = 'NETWORK_ERROR',

    // queue is blocked on an error that requires user intervention
    BLOCKED_ON_ERROR = 'BLOCKED_ON_ERROR',
}

export type ObjectAsSet = { [key: string]: true };

export enum DraftQueueState {
    /** Currently processing an item in the queue or queue is empty and waiting to process the next item. */
    Started = 'started',
    /**
     * The queue is stopped and will not attempt to upload any drafts until startDraftQueue() is called.
     * This is the initial state when the DraftQueue gets instantiated.
     */
    Stopped = 'stopped',
    /**
     * The queue is stopped due to a blocking error from the last upload attempt.
     * The queue will not run again until startDraftQueue() is called.
     */
    Error = 'error',
    /**
     * There was a network error and the queue will attempt to upload again shortly.
     * To attempt to force an upload now call startDraftQueue().
     */
    Waiting = 'waiting',
}

export enum DraftQueueEventType {
    /**
     * Triggered before an action is added to the queue
     */
    ActionAdding = 'adding',
    /**
     * Triggered after an action had been added to the queue
     */
    ActionAdded = 'added',
    /**
     * Triggered once an action starts running
     */
    ActionRunning = 'running',
    /**
     * Triggered once an action failed
     */
    ActionFailed = 'failed',
    /**
     * Triggered after a network failure and the action has been scheduled to retry
     */
    ActionRetrying = 'retrying',
    /**
     * Triggered before an action is deleted from the queue
     */
    ActionDeleting = 'deleting',
    /**
     * Triggered after an action has been deleted from the queue
     */
    ActionDeleted = 'deleted',
    /**
     * Triggered after an action has been completed but before it has been removed from the queue
     */
    ActionCompleting = 'completing',
    /**
     * Triggered after an action has been completed and after it has been removed from the queue
     */
    ActionCompleted = 'completed',
}

export interface DraftQueueAddEvent {
    type: DraftQueueEventType.ActionAdded | DraftQueueEventType.ActionAdding;
    action: PendingDraftAction<unknown>;
}

export interface DraftQueueDeleteEvent {
    type: DraftQueueEventType.ActionDeleted | DraftQueueEventType.ActionDeleting;
    action: DraftAction<unknown>;
}

export interface DraftQueueCompleteEvent {
    type: DraftQueueEventType.ActionCompleting | DraftQueueEventType.ActionCompleted;
    action: CompletedDraftAction<unknown>;
}

export interface DraftQueueAcionRunningEvent {
    type: DraftQueueEventType.ActionRunning;
    action: UploadingDraftAction<unknown>;
}

export interface DraftQueueAcionFailedEvent {
    type: DraftQueueEventType.ActionFailed;
    action: ErrorDraftAction<unknown>;
}

export interface DraftQueueActionRetryEvent {
    type: DraftQueueEventType.ActionRetrying;
    action: PendingDraftAction<unknown>;
}

export type DraftQueueEvent =
    | DraftQueueAddEvent
    | DraftQueueCompleteEvent
    | DraftQueueDeleteEvent
    | DraftQueueAcionRunningEvent
    | DraftQueueActionRetryEvent
    | DraftQueueAcionFailedEvent;

export interface DraftQueue {
    /**
     * Enqueues a ResourceRequest into the DraftQueue
     * @param request The resource request to enqueue
     * @param tag The tag to associate the resource request with. This tag can be used to query all draft actions associated with it
     * @returns A promise including the action created for the request
     */
    enqueue<T>(request: ResourceRequest, tag: string): Promise<DraftAction<T>>;

    /**
     * Retrieves ordered actions for all requested tags
     * @param tags A map of tags to get an ordered list of DraftActions for
     * @returns Map of tag name to ordered action array
     */
    getActionsForTags(tags: ObjectAsSet): Promise<DraftActionMap>;

    /**
     * Registers a listener to be notified when the Draft Queue changes
     * @param listener Listener to notify when the draft queue changes, with an optional parameter
     * for a completed DraftAction that triggered the change.
     */
    registerOnChangedListener(listener: DraftQueueChangeListener): () => Promise<void>;

    /**
     * Processes the next action in the draft queue
     */
    processNextAction(): Promise<ProcessActionResult>;

    /**
     * Get the current list of draft actions in queue
     */
    getQueueActions(): Promise<DraftAction<unknown>[]>;

    /** The current state of the DraftQueue */
    getQueueState(): DraftQueueState;

    /**
     * Removes the draft action identified by actionId from the draft queue.
     *
     * @param actionId The action identifier
     */
    removeDraftAction(actionId: string): Promise<void>;

    /** Set the draft queue state to Started and process the next item */
    startQueue(): Promise<void>;

    /** Set the draft queue state to Stopped and don't let another item begin */
    stopQueue(): Promise<void>;
}
