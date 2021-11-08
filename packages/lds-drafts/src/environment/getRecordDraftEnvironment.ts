import { FetchResponse, ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { createBadRequestResponse } from '../DraftFetchResponse';
import { ObjectCreate } from '../utils/language';
import {
    extractRecordIdFromResourceRequest,
    getRecordKeyFromResourceRequest,
    RECORD_ENDPOINT_REGEX,
} from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

/**
 * Checks if a resource request is a GET method on the record endpoint
 * @param request the resource request
 */
function isRequestForGetRecord(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORD_ENDPOINT_REGEX.test(basePath) && method === 'get';
}

/**
 * Checks if a resource request is a GET method on the record endpoint and
 * contains a draft record id in its request
 * @param request the resource request
 * @param isDraftId function to determine if a record id is a draft id
 */
function isRequestForDraftGetRecord(request: ResourceRequest, isDraftId: (id: string) => boolean) {
    if (isRequestForGetRecord(request)) {
        const id = extractRecordIdFromResourceRequest(request);
        if (id !== undefined) {
            return isDraftId(id);
        }
    }

    return false;
}

/**
 * Creates a ResourceRequest containing canonical record ids from a ResourceRequest containing draft record ids
 * @param request ResourceRequest containing draft id
 * @param canonicalRecordStoreKey canonical store key where the record lives
 * @returns a new ResourceRequest which replaces draft id references with canonical id references. undefined if no canonical
 * key exists
 */
function resolveResourceRequestIds(request: ResourceRequest, canonicalRecordStoreKey: string) {
    const recordId = extractRecordIdFromResourceRequest(request);
    if (recordId === undefined) {
        return request;
    }
    const recordKey = keyBuilderRecord({ recordId });

    if (canonicalRecordStoreKey === recordKey) {
        // no mapping exists -- return the request un-modified
        return request;
    }
    const canonicalId = extractRecordIdFromStoreKey(canonicalRecordStoreKey);
    if (canonicalId === undefined) {
        // could not resolve id from request -- return the request un-modified
        return request;
    }
    return {
        ...request,
        basePath: request.basePath.replace(recordId, canonicalId),
        urlParams: { ...request.urlParams, recordId: canonicalId },
    };
}

export function getRecordDraftEnvironment(
    env: DurableEnvironment,
    { isDraftId }: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function <T>(
        resourceRequest: ResourceRequest
    ): Promise<FetchResponse<T>> {
        if (isRequestForDraftGetRecord(resourceRequest, isDraftId) === false) {
            // only override requests to getRecord endpoint that contain draft ids
            return env.dispatchResourceRequest(resourceRequest);
        }

        const recordKey = getRecordKeyFromResourceRequest(resourceRequest);
        if (recordKey === undefined) {
            // record id could not be found in this request, delegate request
            return env.dispatchResourceRequest(resourceRequest);
        }

        const canonicalKey = env.storeGetCanonicalKey(recordKey);

        // if the canonical key matches the key in the resource request it means we do not have a
        // mapping in our cache so return a non-cacheable error
        if (canonicalKey === recordKey) {
            // The only way a request is dispatched with a draft record id is when a required field
            // is requested which isnt in L2 cache or when an optional field that
            // doesnt exist on the object info is requested
            return Promise.reject(
                createBadRequestResponse({
                    message: 'Required field is missing from draft created record',
                })
            );
        }

        // a canonical mapping exists for the draft id passed in, we can create a new resource
        // request with the canonical key and dispatch to the network
        const resolvedRequest = resolveResourceRequestIds(resourceRequest, canonicalKey);
        return env.dispatchResourceRequest(resolvedRequest);
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
