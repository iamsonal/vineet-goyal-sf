import { createOkResponse } from '../DraftFetchResponse';
import type {
    CompletedDraftAction,
    DraftAction,
    ErrorDraftAction,
    Action,
    PendingDraftAction,
    QueueOperation,
} from '../DraftQueue';
import { DraftActionStatus, ProcessActionResult, QueueOperationType } from '../DraftQueue';
import { generateUniqueDraftActionId } from '../DurableDraftQueue';
import type { ActionHandler } from './ActionHandler';

export enum CustomActionResultType {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
}

export enum CustomActionErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    CLIENT_ERROR = 'CLIENT_ERROR',
}

export interface CustomActionError {
    type: CustomActionErrorType;
    message: string;
}

interface BaseCustomActionResult {
    id: string;
    type: CustomActionResultType;
}

export interface CustomActionSuccess extends BaseCustomActionResult {
    type: CustomActionResultType.SUCCESS;
}

export interface CustomActionFailed extends BaseCustomActionResult {
    type: CustomActionResultType.FAILURE;
    error: CustomActionError;
}

export type CustomActionResult = CustomActionSuccess | CustomActionFailed;

function isCustomActionSuccess(result: CustomActionResult): result is CustomActionSuccess {
    return result.type === CustomActionResultType.SUCCESS;
}

function isCustomActionFailed(result: CustomActionResult): result is CustomActionFailed {
    return result.type === CustomActionResultType.FAILURE;
}

export type CustomActionExecutor = (
    action: DraftAction<unknown, unknown>,
    completed: (result: CustomActionResult) => void
) => void;

export type CustomActionCompletionResponse = (result: CustomActionResult) => void;

export interface CustomActionData {
    [key: string]: string;
}

export function customActionHandler(
    executor: CustomActionExecutor,
    actionCompleted: (action: CompletedDraftAction<unknown, CustomActionData>) => Promise<void>,
    actionErrored: (action: DraftAction<unknown, CustomActionData>, retry: boolean) => Promise<void>
): ActionHandler<CustomActionData> {
    const handle = (action: DraftAction<unknown, CustomActionData>) => {
        notifyCustomActionToExecute(action);
        return Promise.resolve(ProcessActionResult.CUSTOM_ACTION_WAITING);
    };

    const notifyCustomActionToExecute = (action: DraftAction<unknown, CustomActionData>) => {
        if (executor !== undefined) {
            executor(action, executorCompleted(action));
        }
    };

    const executorCompleted =
        (action: DraftAction<unknown, CustomActionData>) => (result: CustomActionResult) => {
            if (isCustomActionSuccess(result)) {
                actionCompleted({
                    ...action,
                    status: DraftActionStatus.Completed,
                    response: createOkResponse(undefined),
                });
            } else if (isCustomActionFailed(result)) {
                actionErrored(
                    {
                        ...action,
                        status: DraftActionStatus.Error,
                        error: result.error.message,
                    } as ErrorDraftAction<unknown, CustomActionData>,
                    result.error.type === CustomActionErrorType.NETWORK_ERROR
                );
            }
        };

    const buildPendingAction = <Response>(
        action: Action<CustomActionData>,
        queue: DraftAction<unknown, unknown>[]
    ) => {
        const { data, tag, targetId, handler } = action;
        const id = generateUniqueDraftActionId(queue.map((a) => a.id));
        return {
            id,
            targetId,
            status: DraftActionStatus.Pending,
            data,
            tag,
            timestamp: Date.now(),
            metadata: data,
            handler,
        } as PendingDraftAction<Response, CustomActionData>;
    };

    const queueOperationsForCompletedDraft = <Response>(
        _queue: DraftAction<unknown, unknown>[],
        action: CompletedDraftAction<Response, CustomActionData>
    ): QueueOperation[] => {
        const { id } = action;
        const queueOperations: QueueOperation[] = [];

        queueOperations.push({
            type: QueueOperationType.Delete,
            id: id,
        });

        return queueOperations;
    };

    const replaceAction = <_Response>(
        actionId: string,
        _withActionId: string,
        _uploadingActionId: String | undefined,
        _actions: DraftAction<unknown, unknown>[]
    ) => {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error(
            `${actionId} does not support action replacing. You can only delete ${actionId}`
        );
    };

    const getRedirectMapping = (_action: CompletedDraftAction<unknown, unknown>) => {
        return undefined;
    };

    return {
        handle,
        buildPendingAction,
        queueOperationsForCompletedDraft,
        replaceAction,
        getRedirectMapping,
    };
}
