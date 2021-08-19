import { DurableStoreOperation, DurableStoreOperationType } from '@luvio/environments';
import { createOkResponse } from '../DraftFetchResponse';
import {
    CompletedDraftAction,
    DraftAction,
    ErrorDraftAction,
    DraftActionStatus,
    ProcessActionResult,
    Action,
    PendingDraftAction,
    DraftIdMappingEntry,
} from '../DraftQueue';
import { DRAFT_SEGMENT, generateUniqueDraftActionId } from '../DurableDraftQueue';
import { buildDraftDurableStoreKey } from '../utils/records';
import { ActionHandler } from './ActionHandler';

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

    const storeOperationsForUploadedDraft = <Response>(
        _queue: DraftAction<unknown, unknown>[],
        action: CompletedDraftAction<Response, CustomActionData>
    ): DurableStoreOperation<DraftIdMappingEntry | DraftAction<Response, CustomActionData>>[] => {
        const { tag, id } = action;
        const storeOperations: DurableStoreOperation<
            DraftIdMappingEntry | DraftAction<Response, CustomActionData>
        >[] = [];

        //delete the action from the store
        const durableEntryKey = buildDraftDurableStoreKey(tag, id);
        storeOperations.push({
            ids: [durableEntryKey],
            type: DurableStoreOperationType.EvictEntries,
            segment: DRAFT_SEGMENT,
        });

        return storeOperations;
    };

    const replaceAction = <Response>(
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

    return {
        handle,
        buildPendingAction,
        storeOperationsForUploadedDraft,
        replaceAction,
    };
}
