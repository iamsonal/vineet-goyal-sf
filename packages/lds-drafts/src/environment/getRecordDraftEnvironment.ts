import { ResourceRequest, ResourceResponse, UnfulfilledSnapshot } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import {
    createBadRequestResponse,
    createDraftSynthesisErrorResponse,
    createOkResponse,
} from '../DraftFetchResponse';
import { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';
import { ObjectCreate } from '../utils/language';
import {
    extractRecordIdFromResourceRequest,
    filterRecordFields,
    getRecordFieldsFromRecordRequest,
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

/**
 * Creates a synthetic response for a call to the getRecord endpoint if the
 * record is a draft record and has not been created yet
 * @param resourceRequest
 */
function createSyntheticGetRecordResponse(
    resourceRequest: ResourceRequest,
    durableStore: RecordDenormalizingDurableStore
) {
    const key = getRecordKeyFromResourceRequest(resourceRequest);

    if (key === undefined) {
        return Promise.reject(
            createBadRequestResponse({
                message: 'Unable to calculate RecordRepresentation key from ResourceRequest.',
            })
        );
    }

    const fields = getRecordFieldsFromRecordRequest(resourceRequest);
    if (fields === undefined) {
        return Promise.reject(createBadRequestResponse({ message: 'fields are missing' }));
    }

    return durableStore.getDenormalizedRecord(key).then((record) => {
        if (record === undefined) {
            throw createDraftSynthesisErrorResponse();
        }
        return createOkResponse(filterRecordFields(record, fields));
    });
}

function handleGetRecordRequest(
    resourceRequest: ResourceRequest,
    env: DurableEnvironment,
    durableStore: RecordDenormalizingDurableStore,
    isDraftId: (id: string) => boolean,
    fetchRequest: (request: ResourceRequest) => Promise<ResourceResponse<RecordRepresentation>>
) {
    if (isRequestForDraftGetRecord(resourceRequest, isDraftId) === false) {
        // only override requests to getRecord endpoint that contain draft ids
        return fetchRequest(resourceRequest);
    }

    const recordKey = getRecordKeyFromResourceRequest(resourceRequest);
    if (recordKey === undefined) {
        // record id could not be found in this request, delegate request
        return fetchRequest(resourceRequest);
    }

    const canonicalKey = env.storeGetCanonicalKey(recordKey);

    // if the canonical key matches the key in the resource request it means we do not have a
    // mapping in our cache and this record must be synthetically returned
    if (canonicalKey === recordKey) {
        return createSyntheticGetRecordResponse(resourceRequest, durableStore);
    }

    // a canonical mapping exists for the draft id passed in, we can create a new resource
    // request with the canonical key and dispatch to the network
    const resolvedRequest = resolveResourceRequestIds(resourceRequest, canonicalKey);
    return fetchRequest(resolvedRequest);
}

export function getRecordDraftEnvironment(
    env: DurableEnvironment,
    { durableStore, isDraftId }: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function <T>(
        resourceRequest: ResourceRequest
    ) {
        return handleGetRecordRequest(
            resourceRequest,
            env,
            durableStore,
            isDraftId,
            env.dispatchResourceRequest
        ) as any;
    };

    const resolveUnfulfilledSnapshot: DurableEnvironment['resolveUnfulfilledSnapshot'] = function <
        T
    >(
        resourceRequest: ResourceRequest,
        snapshot: UnfulfilledSnapshot<T, unknown>
    ): Promise<ResourceResponse<T>> {
        return handleGetRecordRequest(
            resourceRequest,
            env,
            durableStore,
            isDraftId,
            (request) => env.resolveUnfulfilledSnapshot(request, snapshot) as any
        ) as any;
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
        resolveUnfulfilledSnapshot: { value: resolveUnfulfilledSnapshot },
    });
}
