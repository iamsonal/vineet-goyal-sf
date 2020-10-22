import { ResourceRequest, FetchResponse } from '@ldsjs/engine';

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

export type DraftAction<T> =
    | CompletedDraftAction<T>
    | PendingDraftAction<T>
    | ErrorDraftAction<T>
    | UploadingDraftAction<T>;

export type DraftQueueCompletedListener = (completed: CompletedDraftAction<unknown>) => void;

export type DraftActionMap = { [tag: string]: Readonly<DraftAction<unknown>>[] };

export enum ProcessActionResult {
    ACTION_ERRORED = -1,
    ACTION_SUCCEEDED = 0,
    NO_ACTION_TO_PROCESS = 1,
    ACTION_ALREADY_PROCESSING = 2,
}

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
    getActionsForTags(tags: { [tag: string]: true }): Promise<DraftActionMap>;

    /**
     * Registers a listener to be notified when a DraftAction completes
     * @param listener Listener to notify when a DraftAction is completed
     */
    registerDraftQueueCompletedListener(listener: DraftQueueCompletedListener): void;

    /**
     * Processes the next action in the draft queue
     */
    processNextAction(): Promise<ProcessActionResult>;
}
