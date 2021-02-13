import { ResourceRequest } from '@luvio/engine';
import { DurableEnvironment } from '@luvio/environments';
import { createBadRequestResponse, createDeletedResponse } from '../DraftFetchResponse';
import { ObjectCreate } from '../utils/language';
import { getRecordKeyFromRecordRequest, RECORD_ENDPOINT_REGEX } from '../utils/records';
import { DraftEnvironmentOptions } from './makeEnvironmentDraftAware';

/**
 * Checks if a provided resource request is a DELETE operation on the record
 * endpoint. If so, it returns true indicating that the request should be enqueued instead of
 * hitting the network.
 * @param request the resource request
 */
function isRequestDeleteRecord(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORD_ENDPOINT_REGEX.test(basePath) && method === 'delete';
}

export function deleteRecordDraftEnvironment(
    env: DurableEnvironment,
    options: DraftEnvironmentOptions
): DurableEnvironment {
    const draftDeleteSet = new Set<string>();

    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function(
        resourceRequest: ResourceRequest
    ) {
        const { draftQueue } = options;
        if (isRequestDeleteRecord(resourceRequest) === false) {
            // only override requests to deleteRecord endpoint
            return env.dispatchResourceRequest(resourceRequest);
        }

        const key = getRecordKeyFromRecordRequest(resourceRequest);
        if (key === undefined) {
            return createBadRequestResponse({
                message: 'missing record id in request',
            }) as any;
        }

        return draftQueue.enqueue(resourceRequest, key).then(() => {
            draftDeleteSet.add(key);
            return createDeletedResponse() as any;
        });
    };

    const storeEvict: DurableEnvironment['storeEvict'] = function(key: string) {
        // when a storeEvict is called immediately following a draft delete, ensure that it
        // only gets evicted from the in-memory store, we need to keep the record in durable store
        // until the action to delete it on the server succeeds.
        if (draftDeleteSet.has(key)) {
            draftDeleteSet.delete(key);
            options.store.evict(key);
            return;
        }

        env.storeEvict(key);
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
        storeEvict: { value: storeEvict },
    });
}
