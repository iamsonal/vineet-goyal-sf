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
    { draftQueue, prefixForApiName, generateId, isDraftId, store }: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function<T>(
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

        return prefixForApiName(apiName).then(prefix => {
            const recordId = generateId(prefix);
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
        });
    };

    // TODO - W-9099212 - remove this override once draft-created records
    // go into DS.  We need this for now because draft-created records do not
    // actually go into default segment today so if we let them go into pending
    // writers then they will get emitted from in-memory store on broadcast.
    const storePublish: DurableEnvironment['storePublish'] = function<Data>(
        key: string,
        data: Data
    ) {
        const recordId = extractRecordIdFromStoreKey(key);
        if (recordId !== undefined && isDraftId(recordId) === true) {
            store.publish<Data>(key, data);
            return;
        }

        env.storePublish(key, data);
    };

    // TODO - W-9099212 - remove this override once draft-created records
    // go into DS.  We need this for now because draft-created records do not
    // actually go into default segment today so if we let them go into pending
    // writers then they will get emitted from in-memory store on broadcast.
    const storeSetExpiration: DurableEnvironment['storeSetExpiration'] = function(
        key: string,
        expiration: number,
        staleExpiration?: number
    ) {
        const recordId = extractRecordIdFromStoreKey(key);
        if (recordId !== undefined && isDraftId(recordId) === true) {
            store.setExpiration(key, expiration, staleExpiration);
            return;
        }

        env.storeSetExpiration(key, expiration, staleExpiration);
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
        storePublish: { value: storePublish },
        storeSetExpiration: { value: storeSetExpiration },
    });
}
