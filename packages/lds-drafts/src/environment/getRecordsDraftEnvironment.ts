import { ResourceRequest, ResourceResponse, Environment, HttpStatusCode } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord, BatchRepresentation } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { createOkResponse, DRAFT_ERROR_CODE } from '../DraftFetchResponse';
import { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';
import { ArrayIsArray, ObjectCreate } from '../utils/language';
import {
    filterRecordFields,
    getRecordFieldsFromRecordRequest,
    getRecordKeyForId,
} from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

export const RECORDS_ENDPOINT_REGEX = /^\/ui-api\/records\/batch\/?(([a-zA-Z0-9,]+))?$/;

/**
 * Checks if a resource request is a GET method on the record batch endpoint
 * @param request the resource request
 */
function isRequestForGetRecords(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORDS_ENDPOINT_REGEX.test(basePath) && method === 'get';
}

/**
 * Extracts all record ids from a request
 * @param request the resource request
 */
function extractRecordIdsFromResourceRequest(request: ResourceRequest) {
    const ids = request.urlParams['recordIds'];
    if (ArrayIsArray(ids) === false) {
        return undefined;
    }
    return ids as string[];
}

/**
 * Rebuilds a resource request containing provided ids
 * @param request The original resource request
 * @param ids a set of ids to request
 * @returns a copy of the original resource request containing only the requested ids
 */
function rebuildResourceRequestWithIds(request: ResourceRequest, ids: string[]) {
    const { basePath } = request;

    const basePathParts = basePath.split('/');
    basePathParts.pop();
    const resolvedPath = basePathParts.join('/') + '/' + ids.join(',');
    return {
        ...request,
        basePath: resolvedPath,
        urlParams: { ...request.urlParams, recordIds: ids },
    };
}

/**
 * Extracts all ids from a given resource request and returns the ids split into
 * all ids, draft ids and canonical ids
 * @param resourceRequest
 * @param env
 * @param isDraftId
 */
function extractDraftAndCanonicalIdsFromRequest(
    resourceRequest: ResourceRequest,
    env: Environment,
    isDraftId: (id: string) => boolean
) {
    const allIds = extractRecordIdsFromResourceRequest(resourceRequest);
    const canonicalIds: string[] = [];
    const draftIds: string[] = [];

    if (allIds === undefined) {
        return {
            allIds,
            draftIds,
            canonicalIds,
        };
    }

    for (let i = 0, len = allIds.length; i < len; i++) {
        const recordId = allIds[i];

        if (isDraftId(recordId)) {
            const recordKey = keyBuilderRecord({ recordId });
            const canonicalKey = env.storeGetCanonicalKey(recordKey);
            if (recordKey !== canonicalKey) {
                // record is no longer a draft, include the canonical id in the request
                const canonicalId = extractRecordIdFromStoreKey(canonicalKey);
                if (canonicalId !== undefined) {
                    canonicalIds.push(canonicalId);
                }
            } else {
                draftIds.push(recordId);
            }
        } else {
            canonicalIds.push(recordId);
        }
    }

    return {
        allIds,
        draftIds,
        canonicalIds,
    };
}

/**
 * Includes requested synthesized draft records with a batch response
 * @param resourceRequest the request
 * @param response the response containing records with canonical records
 * @param draftIds the list of draftIds to include with the response
 * @param env the environment
 */
function applyDraftsToBatchResponse(
    resourceRequest: ResourceRequest,
    response: ResourceResponse<BatchRepresentation>,
    draftIds: string[],
    env: DurableEnvironment,
    durableStore: RecordDenormalizingDurableStore
) {
    const { length } = draftIds;
    if (length === 0) {
        return response;
    }

    const fields = getRecordFieldsFromRecordRequest(resourceRequest) || [];
    const requestedIds = extractRecordIdsFromResourceRequest(resourceRequest) || [];
    const promises = draftIds.map((draftId) => {
        const draftKey = keyBuilderRecord({ recordId: draftId });
        return durableStore.getDenormalizedRecord(draftKey).then((record) => {
            if (record === undefined) {
                return;
            }
            return filterRecordFields(record, fields);
        });
    });
    return Promise.all(promises).then((results) => {
        for (let i = 0; i < length; i++) {
            const record = results[i];
            if (record === undefined) {
                response.body.results.push({
                    statusCode: HttpStatusCode.BadRequest,
                    result: {
                        errorCode: DRAFT_ERROR_CODE,
                        message: 'failed to synthesize draft record',
                    },
                });
            } else {
                // It is a luvio invariant that the order of resources in response
                // matches the order of ids in the request
                const requestIndex = requestedIds.indexOf(record.id);
                const insertIndex = requestIndex >= 0 ? requestIndex : 0;
                response.body.results.splice(insertIndex, 0, {
                    statusCode: 200,
                    result: record,
                });
            }
        }
        return response;
    });
}

/**
 * Checks to see if a record id has been redirected
 * @param id A record id
 */
function hasIdChanged(id: string, env: Environment) {
    const draftKey = getRecordKeyForId(id);
    const canonicalKey = env.storeGetCanonicalKey(draftKey);
    return canonicalKey !== draftKey;
}

/**
 * Checks a set of ids to determine if any of them have been redirected
 * @param ids A set of ids
 * @param env The environment
 */
function hasIdsChanged(ids: string[], env: Environment) {
    // since the network returned, we may have ingested a draft response, check if any of the passed in draft ids have canonical id mappings

    for (let i = 0, len = ids.length; i < len; i++) {
        const draftId = ids[i];
        if (hasIdChanged(draftId, env)) {
            return true;
        }
    }
    return false;
}

/**
 * Extracts draft ids from a provided resource request.
 * If the request only contains draft ids, a synthetic response is returned
 * If the request only contains canonical ids, the request is issued as normal
 * If the request contains a mix of draft ids and canonical ids, a new request is formed
 * containing only canonical ids and its response is merged with synthetic draft records
 * @param resourceRequest the original resource request
 * @param env the environment
 * @param isDraftId function to determine if a given id is a draft id
 * @param fetchRequest function to fetch a resource request
 */
function handleGetRecordsRequest(
    resourceRequest: ResourceRequest,
    env: DurableEnvironment,
    durableStore: RecordDenormalizingDurableStore,
    isDraftId: (id: string) => boolean,
    fetchRequest: (
        request: ResourceRequest,
        removedDraftIds: string[]
    ) => Promise<ResourceResponse<BatchRepresentation>>
) {
    const { canonicalIds, draftIds } = extractDraftAndCanonicalIdsFromRequest(
        resourceRequest,
        env,
        isDraftId
    );

    if (canonicalIds.length === 0) {
        // all ids are draft ids, full response needs to be synthesized
        const syntheticEnvelop = {
            results: [],
        };
        return applyDraftsToBatchResponse(
            resourceRequest,
            createOkResponse(syntheticEnvelop),
            draftIds,
            env,
            durableStore
        );
    }

    // rebuild request containing only canonical ids
    const resolvedRequest = rebuildResourceRequestWithIds(resourceRequest, canonicalIds);

    return fetchRequest(resolvedRequest, draftIds);
}

export function getRecordsDraftEnvironment(
    env: DurableEnvironment,
    { durableStore, isDraftId }: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function (
        resourceRequest: ResourceRequest
    ) {
        if (isRequestForGetRecords(resourceRequest) === false) {
            // only override requests to getRecords endpoint
            return env.dispatchResourceRequest(resourceRequest);
        }

        return handleGetRecordsRequest(
            resourceRequest,
            env,
            durableStore,
            isDraftId,
            (request: ResourceRequest, removedDraftIds: string[]) =>
                env.dispatchResourceRequest<BatchRepresentation>(request).then((response) => {
                    // check if any of the draft ids have been ingested since the request was dispatched.
                    // if some draft ids have become canonical, we must refetch the request including all ids
                    if (hasIdsChanged(removedDraftIds, env)) {
                        return dispatchResourceRequest(resourceRequest);
                    }

                    // response contains records we asked for with canonical ids, now we need to merge with
                    // synthetic drafts
                    return applyDraftsToBatchResponse(
                        resourceRequest,
                        response,
                        removedDraftIds,
                        env,
                        durableStore
                    );
                })
        ) as any;
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
