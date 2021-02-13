import { ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { createBadRequestResponse, createInternalErrorResponse } from '../DraftFetchResponse';
import { ObjectCreate } from '../utils/language';
import { getRecordFieldsFromRecordRequest, RECORD_ENDPOINT_REGEX } from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';
import { createSyntheticRecordResponse } from './utils';

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

export function createRecordDraftEnvironment(
    env: DurableEnvironment,
    options: DraftEnvironmentOptions
): DurableEnvironment {
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function<T>(
        resourceRequest: ResourceRequest
    ) {
        const { generateId, draftQueue } = options;
        if (isRequestCreateRecord(resourceRequest) === false) {
            // only override requests to createRecord endpoint
            return env.dispatchResourceRequest(resourceRequest);
        }

        const apiName = resourceRequest.body.apiName;

        if (apiName === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message: 'apiName missing from request body.',
                })
            );
        }

        const recordId = generateId(apiName);
        const key = keyBuilderRecord({ recordId });

        return draftQueue.enqueue(resourceRequest, key).then(() => {
            const fields = getRecordFieldsFromRecordRequest(resourceRequest);
            if (fields === undefined) {
                throw createBadRequestResponse({ message: 'fields are missing' });
            }
            // revive the modified record to the in-memory store
            return env
                .reviveRecordsToStore([key])
                .then(() => {
                    return createSyntheticRecordResponse(key, fields, false, env) as any;
                })
                .catch(() => {
                    throw createInternalErrorResponse();
                });
        });
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
