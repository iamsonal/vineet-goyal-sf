import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { RecordRepresentation } from 'packages/lds-adapters-uiapi/dist/types/src/main';
import {
    LDSAction,
    CompletedDraftAction,
    DraftAction,
    DraftActionStatus,
    ErrorDraftAction,
    PendingDraftAction,
    ProcessActionResult,
    QueueOperation,
    QueueOperationType,
    DraftIdMappingEntry,
} from '../DraftQueue';
import { generateUniqueDraftActionId, QueuePostHandler } from '../DurableDraftQueue';
import { ActionHandler } from './ActionHandler';

export const LDS_ACTION_HANDLER_ID = 'LDS_ACTION_HANDLER';
export const LDS_ACTION_METADATA_API_NAME = 'LDS_ACTION_METADATA_API_NAME';

export function createLDSAction(
    targetId: string,
    targetApiName: string,
    tag: string,
    data: ResourceRequest
): LDSAction<ResourceRequest> {
    return {
        targetId,
        targetApiName,
        tag,
        data,
        handler: LDS_ACTION_HANDLER_ID,
    };
}

export function ldsActionHandler(
    networkAdapter: NetworkAdapter,
    updateQueueOnPostCompletion: QueuePostHandler,
    actionCompleted: (action: CompletedDraftAction<unknown, ResourceRequest>) => Promise<void>,
    actionErrored: (action: DraftAction<unknown, ResourceRequest>, retry: boolean) => Promise<void>
): ActionHandler<ResourceRequest> {
    const handle = (action: DraftAction<unknown, ResourceRequest>) => {
        const { data: request } = action;
        return networkAdapter(request)
            .then((response) => {
                return actionCompleted({
                    ...action,
                    response,
                    status: DraftActionStatus.Completed,
                }).then(() => ProcessActionResult.ACTION_SUCCEEDED);
            })
            .catch((err: unknown) => {
                // if the error is a FetchResponse shape then it's a bad request
                if (isErrorFetchResponse(err)) {
                    return actionErrored(
                        {
                            ...action,
                            error: err,
                            status: DraftActionStatus.Error,
                        } as ErrorDraftAction<unknown, ResourceRequest>,
                        false
                    ).then(() => ProcessActionResult.ACTION_ERRORED);
                }

                return actionErrored(action, true).then(() => ProcessActionResult.NETWORK_ERROR);
            });
    };

    const buildPendingAction = <Response>(
        action: LDSAction<ResourceRequest>,
        queue: DraftAction<unknown, unknown>[]
    ) => {
        const { data, tag, targetId, handler, targetApiName } = action;
        if (process.env.NODE_ENV !== 'production') {
            if (data.method === 'post' && actionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a POST draft action with an existing tag');
            }

            if (deleteActionsForTag(tag, queue).length > 0) {
                throw new Error('Cannot enqueue a draft action for a deleted record');
            }
        }

        const id = generateUniqueDraftActionId(queue.map((a) => a.id));
        return {
            id,
            targetId,
            status: DraftActionStatus.Pending,
            data,
            tag,
            timestamp: Date.now(),
            metadata: { LDS_ACTION_METADATA_API_NAME: targetApiName },
            handler,
        } as PendingDraftAction<Response, ResourceRequest>;
    };

    /**
     * Invoked after the queue completes a POST action and creates a resource on the server.
     * Entities further down the queue may need to be updated after a resource is created on
     * the server as they may contain references to the created item.
     * The DraftQueue is unaware of the contents of the DraftActions so it calls out to the consumer with the
     * completed action and the remaining queue items. The consumer will process the completed action and indicate what
     * queue operations the DraftQueue must take to update its entries with the new entity id
     * @param action the action that just completed
     * @param queue the current queue DraftActions
     */
    const queueOperationsForCompletedDraft = <Response>(
        queue: DraftAction<unknown, unknown>[],
        action: CompletedDraftAction<Response, ResourceRequest>
    ): QueueOperation[] => {
        const queueOperations: QueueOperation[] = [];

        if (action.data.method === 'post') {
            updateQueueOnPostCompletion(action, queue).forEach((operation) => {
                queueOperations.push(operation);
            });
        }

        // delete completed action
        queueOperations.push({
            type: QueueOperationType.Delete,
            id: action.id,
        });

        return queueOperations;
    };

    const getRedirectMapping = (
        action: CompletedDraftAction<unknown, unknown>
    ): DraftIdMappingEntry | undefined => {
        const ldsAction = action as CompletedDraftAction<RecordRepresentation, ResourceRequest>;

        if (ldsAction.data.method === 'post') {
            const { response } = ldsAction;
            const draftId = action.targetId;
            const canonicalId = response.body.id;
            return { draftId, canonicalId };
        }
        return undefined;
    };

    const replaceAction = <Response>(
        actionId: string,
        withActionId: string,
        uploadingActionId: String | undefined,
        actions: DraftAction<unknown, unknown>[]
    ) => {
        // get the action to replace
        const actionToReplace = actions.filter((action) => action.id === actionId)[0];
        // get the replacing action
        const replacingAction = actions.filter((action) => action.id === withActionId)[0];
        // reject if either action is undefined
        if (actionToReplace === undefined || replacingAction === undefined) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('One or both actions does not exist');
        }
        // reject if either action is uploading
        if (actionToReplace.id === uploadingActionId || replacingAction.id === uploadingActionId) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Cannot replace an draft action that is uploading');
        }
        // reject if these two draft actions aren't acting on the same target
        if (actionToReplace.tag !== replacingAction.tag) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Cannot swap actions targeting different targets');
        }
        // reject if the replacing action is not pending
        if (replacingAction.status !== DraftActionStatus.Pending) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Cannot replace with a non-pending action');
        }

        if (
            isLDSDraftAction<Response>(actionToReplace) &&
            isLDSDraftAction<Response>(replacingAction)
        ) {
            const actionToReplaceCopy: PendingDraftAction<Response, ResourceRequest> = {
                ...actionToReplace,
                status: DraftActionStatus.Pending,
            };
            actionToReplace.status = DraftActionStatus.Pending;
            actionToReplace.data = replacingAction.data;

            return {
                original: actionToReplaceCopy,
                actionToReplace: actionToReplace,
                replacingAction: replacingAction,
            };
        } else {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Incompatable Action types to replace one another');
        }
    };

    return {
        handle,
        buildPendingAction,
        queueOperationsForCompletedDraft,
        getRedirectMapping,
        replaceAction,
    };
}

function isErrorFetchResponse<T>(error: unknown): error is FetchResponse<T> {
    return typeof error === 'object' && error !== null && 'status' in error;
}

function actionsForTag(
    tag: string,
    queue: DraftAction<unknown, unknown>[]
): DraftAction<unknown, unknown>[] {
    return queue.filter((action) => action.tag === tag);
}

function deleteActionsForTag(
    tag: string,
    queue: DraftAction<unknown, unknown>[]
): DraftAction<unknown, unknown>[] {
    return actionsForTag(tag, queue).filter((action) => {
        return isLDSDraftAction(action) ? action.data.method === 'delete' : false;
    });
}

export function isLDSDraftAction<Response>(
    action: DraftAction<unknown, unknown>
): action is DraftAction<Response, ResourceRequest> {
    return action.handler === LDS_ACTION_HANDLER_ID;
}
