import { Adapter, Environment, ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import {
    keyBuilderRecord,
    RecordRepresentation,
    GetRecordConfig,
} from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { createLDSAction } from '../actionHandlers/LDSActionHandler';
import {
    createBadRequestResponse,
    createDraftSynthesisErrorResponse,
    createInternalErrorResponse,
    createOkResponse,
} from '../DraftFetchResponse';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import {
    ensureReferencedIdsAreCached,
    extractRecordIdFromResourceRequest,
    filterRecordFields,
    getRecordFieldsFromRecordRequest,
    getRecordIdFromRecordRequest,
    getRecordKeyFromRecordRequest,
    RECORD_ENDPOINT_REGEX,
    RequestFields,
} from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

export interface UpdateRecordDraftEnvironmentOptions extends DraftEnvironmentOptions {
    getRecord: Adapter<GetRecordConfig, RecordRepresentation>;
}

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
    {
        isDraftId,
        durableStore,
        store,
        draftQueue,
        getRecord,
        apiNameForPrefix,
        getObjectInfo,
    }: UpdateRecordDraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function (
        resourceRequest: ResourceRequest
    ) {
        if (isRequestUpdateRecord(resourceRequest) === false) {
            // only override requests to updateRecord endpoint
            return env.dispatchResourceRequest(resourceRequest);
        }

        const resolvedRequest = resolveResourceRequestIds(resourceRequest, env, isDraftId);

        const key = getRecordKeyFromRecordRequest(resolvedRequest);
        const targetId = getRecordIdFromRecordRequest(resolvedRequest);
        if (key === undefined || targetId === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message: 'missing record id in request',
                })
            ) as any;
        }

        const prefix = targetId.substring(0, 3);
        const fields = getRecordFieldsFromRecordRequest(resolvedRequest);

        return apiNameForPrefix(prefix).then((apiName) => {
            return assertReferenceIdsAreCached(apiName, resolvedRequest.body.fields).then(() => {
                return assertRecordIsCached(key, targetId, apiName, fields).then(() => {
                    return enqueueRequest(resolvedRequest, key, targetId);
                });
            });
        });
    };

    /**
     * Asserts that any refrence ids being edited exist in the store
     * @param apiName apiName of record being updated
     * @param fields fields being edited
     * @returns
     */
    function assertReferenceIdsAreCached(apiName: string, fields: Record<string, any>) {
        return ensureReferencedIdsAreCached(durableStore, apiName, fields, getObjectInfo).catch(
            (err: Error) => {
                throw createDraftSynthesisErrorResponse(err.message);
            }
        );
    }

    /**
     * Asserts that the record being edited is in the DurableStore. If it's not in the DurableStore
     * it will attempt to fetch it. If it can't fetch it and it's not in the store it will throw an error
     * @param recordKey
     * @param recordId
     * @param apiName
     * @param requestFields
     */
    function assertRecordIsCached(
        recordKey: string,
        recordId: string,
        apiName: string,
        requestFields: RequestFields
    ) {
        return durableStore
            .getDenormalizedRecord(recordKey)
            .catch(() => {
                throw createInternalErrorResponse();
            })
            .then((entries) => {
                if (entries === undefined) {
                    return fetchRecord(recordId, apiName, requestFields);
                }
            });
    }

    /**
     * Fetches the record being updated so the draft can be applied on top of it
     * @param recordId
     * @param apiName
     * @param requestFields
     */
    function fetchRecord(recordId: string, apiName: string, requestFields: RequestFields) {
        const prefixedFields = {
            fields: requestFields.fields.map((f) => `${apiName}.${f}`),
            optionalFields: requestFields.optionalFields.map((f) => `${apiName}.${f}`),
        };
        return Promise.resolve(
            getRecord({
                recordId,
                ...prefixedFields,
            })
        ).then((snapshot) => {
            if (snapshot === null || snapshot.state === 'Error') {
                throw createDraftSynthesisErrorResponse(
                    'cannot apply a draft to a record that is not cached'
                );
            }
            return snapshot;
        });
    }

    /**
     * Enqueues the update request into the draft queue
     * @param request The resource request that will edit the record
     * @param key The target record's store key
     * @param targetId the record id
     */
    function enqueueRequest(request: ResourceRequest, key: string, targetId: string) {
        return draftQueue.enqueue(createLDSAction(targetId, key, request)).then(() => {
            // TODO: [W-8195289] Draft edited records should include all fields in the Full/View layout if possible
            const fields = getRecordFieldsFromRecordRequest(request);
            if (fields === undefined) {
                throw createBadRequestResponse({
                    message: 'fields are missing',
                });
            }

            // now that there's a mutation request enqueued the value in the
            // store is no longer accurate as it does not have draft values applied
            // so evict it from the store in case anyone tries to access it before we have
            // a chance to revive it with drafts applied
            store.evict(key);

            // revive the modified record to the in-memory store. This will put the record
            // in the in-memory store with the new draft values applied to it
            return durableStore
                .getDenormalizedRecord(key)
                .catch(() => {
                    throw createInternalErrorResponse();
                })
                .then((record) => {
                    if (record === undefined) {
                        throw createDraftSynthesisErrorResponse();
                    }
                    return createOkResponse(filterRecordFields(record, fields));
                });
        });
    }

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
