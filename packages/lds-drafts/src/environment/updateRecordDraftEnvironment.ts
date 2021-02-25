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
    extractRecordIdFromResourceRequest,
    getRecordFieldsFromRecordRequest,
    getRecordKeyFromRecordRequest,
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
function isRequestUpdateRecord(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORD_ENDPOINT_REGEX.test(basePath) && method === 'patch';
}

/**
 * Inspects the resource request for draft id references. Replaces the draft ids
 * with their canonical ids if they exist otherwise returns the request as is
 * @param request: The original resource request
 * @param env: The environment
 * @param isDraftId: (key: string) => boolean: function to check if a given id is a draft id
 */
function resolveResourceRequestIds(
    request: ResourceRequest,
    env: Environment,
    isDraftId: (key: string) => boolean
) {
    const recordId = extractRecordIdFromResourceRequest(request);
    if (recordId === undefined) {
        return request;
    }
    const recordKey = keyBuilderRecord({ recordId });
    const canonicalKey = env.storeGetCanonicalKey(recordKey);

    let resolvedBasePath = request.basePath;
    let resolvedUrlParams = request.urlParams;
    const resolvedBody = request.body;

    if (recordKey !== canonicalKey) {
        const canonicalId = extractRecordIdFromStoreKey(canonicalKey);
        if (canonicalId === undefined) {
            // could not resolve id from request -- return the request un-modified
            return request;
        }
        resolvedBasePath = resolvedBasePath.replace(recordId, canonicalId);
        resolvedUrlParams = { ...resolvedUrlParams, recordId: canonicalId };
    }

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

    return {
        ...request,
        basePath: resolvedBasePath,
        body: resolvedBody,
        urlParams: resolvedUrlParams,
    };
}

export function updateRecordDraftEnvironment(
    env: DurableEnvironment,
    options: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function(
        resourceRequest: ResourceRequest
    ) {
        const { draftQueue } = options;
        if (isRequestUpdateRecord(resourceRequest) === false) {
            // only override requests to updateRecord endpoint
            return env.dispatchResourceRequest(resourceRequest);
        }

        const resolvedRequest = resolveResourceRequestIds(resourceRequest, env, options.isDraftId);

        const key = getRecordKeyFromRecordRequest(resolvedRequest);
        if (key === undefined) {
            return createBadRequestResponse({
                message: 'missing record id in request',
            }) as any;
        }

        return draftQueue.enqueue(resolvedRequest, key).then(() => {
            // TODO: [W-8195289] Draft edited records should include all fields in the Full/View layout if possible
            const fields = getRecordFieldsFromRecordRequest(resolvedRequest);
            if (fields === undefined) {
                throw createBadRequestResponse({ message: 'fields are missing' });
            }

            // now that there's a mutation request enqueued the value in the
            // store is no longer accurate as it does not have draft values applied
            // so evict it from the store in case anyone tries to access it before we have
            // a chance to revive it with drafts applied
            options.store.evict(key);

            // revive the modified record to the in-memory store. This will put the record
            // in the in-memory store with the new draft values applied to it
            return reviveRecordToStore(key, fields, env)
                .catch(() => {
                    throw createInternalErrorResponse();
                })
                .then(record => {
                    if (record === undefined) {
                        throw createDraftSynthesisErrorResponse();
                    }
                    return createOkResponse(record);
                });
        });
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
