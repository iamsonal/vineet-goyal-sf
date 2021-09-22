import {
    Action,
    CompletedDraftAction,
    DraftAction,
    DraftIdMappingEntry,
    PendingDraftAction,
    ProcessActionResult,
    QueueOperation,
} from '../DraftQueue';

export interface ReplacingActions<Response, Data> {
    original: DraftAction<Response, Data>;
    actionToReplace: DraftAction<Response, Data>;
    replacingAction: DraftAction<Response, Data>;
}

/**
 * A Handler that knows what the Data and Response type expected are in a DraftAction.
 * It knows how to process and set them up.
 */
export interface ActionHandler<Data> {
    /**
     * The function the process and handle the Action
     * @param action
     */
    handle(action: DraftAction<unknown, Data>): Promise<ProcessActionResult>;

    /**
     * Used to build a PendingDraftAction that is specific to the type of Data and Response.
     * @param action
     * @param queue
     */
    buildPendingAction<Response>(
        action: Action<Data>,
        queue: DraftAction<unknown, unknown>[]
    ): PendingDraftAction<Response, Data>;

    /**
     * Queue Operation to happen after the action has been completed
     * @param queue
     * @param action
     */
    queueOperationsForCompletedDraft<Response>(
        queue: DraftAction<unknown, unknown>[],
        action: CompletedDraftAction<Response, Data>
    ): QueueOperation[];

    /**
     * Returns a key redirect if necessary
     * @param action
     */
    getRedirectMapping(
        action: CompletedDraftAction<unknown, unknown>
    ): DraftIdMappingEntry | undefined;

    /**
     * Replace an item in the queue with another to take its place (if supported by handler)
     * @param actionId
     * @param withActionId
     * @param uploadingActionId
     * @param actions
     */
    replaceAction<Response>(
        actionId: string,
        withActionId: string,
        uploadingActionId: String | undefined,
        actions: DraftAction<unknown, unknown>[]
    ): ReplacingActions<Response, Data>;
}
