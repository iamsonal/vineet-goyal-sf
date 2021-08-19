import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import {
    DurableStoreEntries,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';
import {
    Action,
    CompletedDraftAction,
    DraftAction,
    DraftActionStatus,
    DraftIdMappingEntry,
    ErrorDraftAction,
    PendingDraftAction,
    ProcessActionResult,
    QueueOperation,
    QueueOperationType,
} from '../DraftQueue';
import {
    CreateDraftIdMappingHandler,
    DRAFT_ID_MAPPINGS_SEGMENT,
    DRAFT_SEGMENT,
    generateUniqueDraftActionId,
    QueuePostHandler,
} from '../DurableDraftQueue';
import { ObjectKeys } from '../utils/language';
import { buildDraftDurableStoreKey } from '../utils/records';
import { ActionHandler } from './ActionHandler';

export const LDS_ACTION_HANDLER_ID = 'LDS_ACTION_HANDLER';

export function createLDSAction(
    targetId: string,
    tag: string,
    data: ResourceRequest
): Action<ResourceRequest> {
    return {
        targetId,
        tag,
        data,
        handler: LDS_ACTION_HANDLER_ID,
    };
}

// retain draft id mappings for 30 days
const MAPPING_TTL = 30 * 24 * 60 * 60 * 1000;

function createDraftMappingEntryKey(draftKey: string, canonicalKey: string) {
    return `DraftIdMapping::${draftKey}::${canonicalKey}`;
}

export function ldsActionHandler(
    networkAdapter: NetworkAdapter,
    updateQueueOnPostCompletion: QueuePostHandler,
    createDraftIdMapping: CreateDraftIdMappingHandler,
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
        action: Action<ResourceRequest>,
        queue: DraftAction<unknown, unknown>[]
    ) => {
        const { data, tag, targetId, handler } = action;
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
            metadata: {},
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
    const storeOperationsForUploadedDraft = <Response>(
        queue: DraftAction<unknown, unknown>[],
        action: CompletedDraftAction<Response, ResourceRequest>
    ): DurableStoreOperation<DraftIdMappingEntry | DraftAction<Response, ResourceRequest>>[] => {
        const { tag, id } = action;
        const storeOperations: DurableStoreOperation<
            DraftIdMappingEntry | DraftAction<Response, ResourceRequest>
        >[] = [];

        if (action.data.method === 'post') {
            const queueOperations = updateQueueOnPostCompletion(action, queue);
            storeOperations.push(
                ...mapQueueOperationsToDurableStoreOperations<Response>(queueOperations)
            );

            const mapping = createDraftIdMapping(action);
            const { draftKey, canonicalKey } = mapping;
            const expiration = Date.now() + MAPPING_TTL;
            const entryKey = createDraftMappingEntryKey(draftKey, canonicalKey);
            const mappingEntries = {
                [entryKey]: {
                    data: mapping,
                    expiration: { fresh: expiration, stale: expiration },
                },
            };

            storeOperations.push({
                entries: mappingEntries,
                type: DurableStoreOperationType.SetEntries,
                segment: DRAFT_ID_MAPPINGS_SEGMENT,
            });
        }

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
        withActionId: string,
        uploadingActionId: String | undefined,
        actions: DraftAction<unknown, unknown>[]
    ) => {
        // get the action to replace
        const actionToReplace = actions.filter((action) => action.id === actionId)[0];
        // get the replacing action
        const replacingAction = actions.filter((action) => action.id === withActionId)[0];
        if (process.env.NODE_ENV !== 'production') {
            // reject if either action is undefined
            if (actionToReplace === undefined || replacingAction === undefined) {
                throw new Error('One or both actions does not exist');
            }
            // reject if either action is uploading
            if (
                actionToReplace.id === uploadingActionId ||
                replacingAction.id === uploadingActionId
            ) {
                throw new Error('Cannot replace an draft action that is uploading');
            }
            // reject if these two draft actions aren't acting on the same target
            if (actionToReplace.tag !== replacingAction.tag) {
                throw new Error('Cannot swap actions targeting different targets');
            }
            // reject if the replacing action is not pending
            if (replacingAction.status !== DraftActionStatus.Pending) {
                throw new Error('Cannot replace with a non-pending action');
            }
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
        storeOperationsForUploadedDraft,
        replaceAction,
    };
}

/**
 * Maps an array of QueueOperations to DurableStoreOperations
 * @param queueOperations list of queue operations to map
 */
function mapQueueOperationsToDurableStoreOperations<Response>(
    queueOperations: QueueOperation[]
): DurableStoreOperation<DraftAction<Response, ResourceRequest>>[] {
    const setEntries: DurableStoreEntries<DraftAction<Response, ResourceRequest>> = {};
    const evictEntries: string[] = [];
    for (let i = 0, len = queueOperations.length; i < len; i++) {
        const operation = queueOperations[i];
        if (operation.type === QueueOperationType.Delete) {
            evictEntries.push(operation.key);
        } else {
            let key = '';
            if (operation.type === QueueOperationType.Add) {
                key = buildDraftDurableStoreKey(operation.action.tag, operation.action.id);
            } else {
                key = operation.key;
            }
            setEntries[key] = { data: operation.action as DraftAction<Response, ResourceRequest> };
        }
    }

    const storeOperations: DurableStoreOperation<DraftAction<Response, ResourceRequest>>[] = [];

    if (ObjectKeys(setEntries).length > 0) {
        storeOperations.push({
            entries: setEntries,
            type: DurableStoreOperationType.SetEntries,
            segment: DRAFT_SEGMENT,
        });
    }

    if (evictEntries.length > 0) {
        storeOperations.push({
            ids: evictEntries,
            type: DurableStoreOperationType.EvictEntries,
            segment: DRAFT_SEGMENT,
        });
    }

    return storeOperations;
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
