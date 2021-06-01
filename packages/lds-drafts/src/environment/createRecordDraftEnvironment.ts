import { Environment, ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { createLDSAction } from '../actionHandlers/LDSActionHandler';
import {
    createBadRequestResponse,
    createDraftSynthesisErrorResponse,
    createInternalErrorResponse,
    createOkResponse,
} from '../DraftFetchResponse';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import { getRecordFieldsFromRecordRequest, RECORD_ENDPOINT_REGEX } from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

/**
 * Checks if a provided resource request is a POST operation on the record
 * endpoint. If so, it returns true indicating that the request should be enqueued instead of
 * hitting the network.
 * @param request the resource request
 */
function isRequestCreateRecord(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORD_ENDPOINT_REGEX.test(basePath) && method === 'post';
}

/**
 * Inspects the resource request for draft id references. Replaces the draft ids
 * with their canonical ids if they exist otherwise returns the request as is
 * @param request The original resource request
 * @param env The environment
 * @param isDraftId: (key: string) => boolean Function to determine if a given id is a draft id
 */
function resolveResourceRequestIds(
    request: ResourceRequest,
    env: Environment,
    isDraftId: (key: string) => boolean
) {
    const resolvedBody = request.body;

    const bodyFields = resolvedBody.fields;
    const fieldNames = ObjectKeys(bodyFields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const fieldValue = bodyFields[fieldName];
        if (isDraftId(fieldValue)) {
            const draftKey = keyBuilderRecord({ recordId: fieldValue });
            const canonicalKey = env.storeGetCanonicalKey(draftKey);
            if (draftKey !== canonicalKey) {
                const canonicalId = extractRecordIdFromStoreKey(canonicalKey);
                bodyFields[fieldName] = canonicalId;
            }
        }
    }

    return { ...request, body: resolvedBody };
}

export function createRecordDraftEnvironment(
    env: DurableEnvironment,
    { draftQueue, prefixForApiName, generateId, isDraftId, durableStore }: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function <T>(
        request: ResourceRequest
    ) {
        if (isRequestCreateRecord(request) === false) {
            // only override requests to createRecord endpoint
            return env.dispatchResourceRequest(request);
        }

        const resolvedResourceRequest = resolveResourceRequestIds(request, env, isDraftId);

        const apiName = resolvedResourceRequest.body.apiName;

        if (apiName === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message: 'apiName missing from request body.',
                })
            );
        }

        return prefixForApiName(apiName).then((prefix) => {
            const recordId = generateId(prefix);
            const key = keyBuilderRecord({ recordId });

            const fields = getRecordFieldsFromRecordRequest(resolvedResourceRequest);
            if (fields === undefined) {
                throw createBadRequestResponse({ message: 'fields are missing' });
            }

            return draftQueue
                .enqueue(createLDSAction(recordId, key, resolvedResourceRequest))
                .then(() => {
                    return durableStore
                        .getDenormalizedRecord(key)
                        .catch(() => {
                            throw createInternalErrorResponse();
                        })
                        .then((record) => {
                            if (record === undefined) {
                                throw createDraftSynthesisErrorResponse();
                            }
                            return createOkResponse(record) as any;
                        });
                });
        });
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
