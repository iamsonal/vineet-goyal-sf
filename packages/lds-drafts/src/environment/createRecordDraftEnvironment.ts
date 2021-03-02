import { Environment, ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import {
    createBadRequestResponse,
    createDraftSynthesisErrorResponse,
    createInternalErrorResponse,
    createOkResponse,
} from '../DraftFetchResponse';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import {
    getRecordFieldsFromRecordRequest,
    RECORD_ENDPOINT_REGEX,
    reviveRecordToStore,
} from '../utils/records';
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
    options: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function<T>(
        request: ResourceRequest
    ) {
        const { generateId, draftQueue } = options;
        if (isRequestCreateRecord(request) === false) {
            // only override requests to createRecord endpoint
            return env.dispatchResourceRequest(request);
        }

        const resolvedResourceRequest = resolveResourceRequestIds(request, env, options.isDraftId);

        const apiName = resolvedResourceRequest.body.apiName;

        if (apiName === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message: 'apiName missing from request body.',
                })
            );
        }

        // TODO: we need to generate proper prefix based on key prefix in the
        // corresponding ObjectInfo
        const recordId = generateId(apiName);
        const key = keyBuilderRecord({ recordId });

        return draftQueue.enqueue(resolvedResourceRequest, key, recordId).then(() => {
            const fields = getRecordFieldsFromRecordRequest(resolvedResourceRequest);
            if (fields === undefined) {
                throw createBadRequestResponse({ message: 'fields are missing' });
            }
            // revive the modified record to the in-memory store
            return reviveRecordToStore(key, fields, env)
                .catch(() => {
                    throw createInternalErrorResponse();
                })
                .then(record => {
                    if (record === undefined) {
                        throw createDraftSynthesisErrorResponse();
                    }
                    return createOkResponse(record) as any;
                });
        });
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
