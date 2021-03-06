import type { Environment, ResourceRequest, StoreMetadata } from '@luvio/engine';
import type { DurableEnvironment } from '@luvio/environments';
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
import {
    ensureReferencedIdsAreCached,
    filterRecordFields,
    getRecordFieldsFromRecordRequest,
    prefixForRecordId,
    RECORD_ENDPOINT_REGEX,
} from '../utils/records';
import type { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

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
    {
        draftQueue,
        prefixForApiName,
        generateId,
        isDraftId,
        durableStore,
        getObjectInfo,
        apiNameForPrefix,
        ensureObjectInfoCached,
    }: DraftEnvironmentOptions
): DurableEnvironment {
    // TODO [W-8909393]: can remove this when metadata is stored separately from data
    const synthesizedIds: Record<string, true> = {};

    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function <_T>(
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

        return assertDraftPrerequisitesSatisfied(apiName, resolvedResourceRequest.body.fields).then(
            () =>
                prefixForApiName(apiName).then((prefix) => {
                    if (prefix === null) {
                        return Promise.reject(
                            createBadRequestResponse({
                                message: 'Cannot create draft for entity with null keyPrefix',
                            })
                        );
                    }

                    return enqueueRequest(prefix, resolvedResourceRequest);
                })
        );
    };

    const publishStoreMetadata: typeof env['publishStoreMetadata'] = function (
        recordKey: string,
        storeMetadata: StoreMetadata
    ) {
        // TODO [W-8909393]: should not have to do this anymore when metadata is stored separately from data
        if (synthesizedIds[recordKey]) {
            delete synthesizedIds[recordKey];
            return;
        }
        const recordId = extractRecordIdFromStoreKey(recordKey);
        if (recordId === undefined || isDraftId(recordId) === false) {
            return env.publishStoreMetadata(recordKey, storeMetadata);
        }
        return env.publishStoreMetadata(recordKey, {
            ...storeMetadata,
            expirationTimestamp: Number.MAX_SAFE_INTEGER,
        });
    };

    /**
     * Ensures that any reference ids being edited and the Object Info exist in the store
     * @param apiName
     * @param fields
     * @returns Promise
     */
    function assertDraftPrerequisitesSatisfied(
        apiName: string,
        fields: Record<string, any>
    ): Promise<void[]> {
        return Promise.all([
            ensureObjectInfoCached(apiName),
            ensureReferencedIdsAreCached(durableStore, apiName, fields, getObjectInfo),
        ]).catch((err: Error) => {
            throw createDraftSynthesisErrorResponse(err.message);
        });
    }

    function enqueueRequest(prefix: string, request: ResourceRequest): any {
        const recordId = generateId(prefix);
        const key = keyBuilderRecord({ recordId });

        const fields = getRecordFieldsFromRecordRequest(request);
        if (fields === undefined) {
            throw createBadRequestResponse({ message: 'fields are missing' });
        }
        return apiNameForPrefix(prefixForRecordId(recordId)).then((apiName) => {
            return draftQueue.enqueue(createLDSAction(recordId, apiName, key, request)).then(() => {
                return durableStore
                    .getDenormalizedRecord(key)
                    .catch(() => {
                        throw createInternalErrorResponse();
                    })
                    .then((record) => {
                        if (record === undefined) {
                            throw createDraftSynthesisErrorResponse();
                        }
                        // TODO [W-8909393]: should not have to do this anymore when metadata is stored separately from data
                        synthesizedIds[key] = true;
                        return createOkResponse(filterRecordFields(record, fields)) as any;
                    });
            });
        });
    }

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
        publishStoreMetadata: { value: publishStoreMetadata },
    });
}
