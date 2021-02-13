import { ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { createBadRequestResponse } from '../DraftFetchResponse';
import { ObjectCreate } from '../utils/language';
import {
    getRecordFieldsFromRecordRequest,
    getRecordKeyFromRecordRequest,
    RECORD_ENDPOINT_REGEX,
} from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';
import { createSyntheticRecordResponse } from './utils';

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

        const key = getRecordKeyFromRecordRequest(resourceRequest);
        if (key === undefined) {
            return createBadRequestResponse({
                message: 'missing record id in request',
            }) as any;
        }

        return draftQueue.enqueue(resourceRequest, key).then(() => {
            // TODO: [W-8195289] Draft edited records should include all fields in the Full/View layout if possible
            const fields = getRecordFieldsFromRecordRequest(resourceRequest);
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
            return env.reviveRecordsToStore([key]).then(() => {
                return createSyntheticRecordResponse(key, fields, false, env) as any;
            });
        });
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
    });
}
