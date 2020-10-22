import { Environment, ResourceRequest, Store } from '@ldsjs/engine';
import { DurableEnvironment } from '@ldsjs/environments';
import { ObjectCreate } from './utils/language';

import {
    getRecordIdFromRecordRequest,
    getRecordFieldsFromRecordRequest,
    buildRecordSelector,
    extractRecordApiNameFromStore,
    getRecordKeyForId,
    shouldDraftResourceRequest,
} from './utils/records';
import { DraftQueue } from './DraftQueue';
import {
    createBadRequestResponse,
    createDeletedResponse,
    createInternalErrorResponse,
    createOkResponse,
} from './DraftFetchResponse';
import { clone } from './utils/clone';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    store: Store,
    draftQueue: DraftQueue
): Environment {
    const draftDeleteSet = new Set<string>();

    /**
     * Overrides the base environment's dispatchResourceRequest method only for calls to the record CUD endpoints
     * Instead of hitting the network, this environment delegates the mutation to the DraftQueue and optimistically returns its result
     * @param resourceRequest The resource request to fetch
     */
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function<T>(
        resourceRequest: ResourceRequest
    ) {
        if (shouldDraftResourceRequest(resourceRequest) === false) {
            return env.dispatchResourceRequest(resourceRequest);
        }

        const { method } = resourceRequest;

        // we tag the resource request with the store key for the affected request
        const id = getRecordIdFromRecordRequest(resourceRequest);
        if (id === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message: 'apiName was missing',
                })
            );
        }
        const key = getRecordKeyForId(id);

        return draftQueue.enqueue(resourceRequest, key).then(() => {
            if (method === 'delete') {
                draftDeleteSet.add(key);
                return createDeletedResponse() as any;
            }

            // TODO: [W-8195289] Draft edited records should include all fields in the Full/View layout if possible
            const fields = getRecordFieldsFromRecordRequest(resourceRequest);
            if (fields === undefined) {
                throw createBadRequestResponse({ message: 'fields are missing' });
            }

            // now that there's a mutation request enqueued the value in the
            // store is no longer accurate as it does not have draft values applied
            // so evict it from the store in case anyone tries to access it before we have
            // a chance to revive it with drafts applied
            store.evict(key);

            // revive the modified record to the in-memory store
            return env.reviveRecordsToStore([key]).then(() => {
                return createOptimisticRecordResponse(key, fields);
            });
        });
    };

    function createOptimisticRecordResponse(key: string, fields: string[]) {
        const apiName = extractRecordApiNameFromStore(key, env);
        if (apiName === null) {
            // TODO: uncomment once logger is injected to engine
            // env.log('record not in store after revival');
            throw createInternalErrorResponse();
        }

        const selector = buildRecordSelector(
            key,
            fields.map(f => `${apiName}.${f}`)
        );
        const snapshot = env.storeLookup<RecordRepresentation>(selector, env.createSnapshot);
        const { state } = snapshot;
        if (state !== 'Fulfilled' && state !== 'Stale') {
            // TODO: uncomment once logger is injected to engine
            // env.log('Snapshot is not fulfilled after a revival');
            throw createInternalErrorResponse();
        }

        // We need the data to be mutable to go through ingest/normalization.
        // Eventually storeLookup will supply a mutable version however for now we need
        // to make it mutable ourselves.
        const mutableData = clone(snapshot.data) as RecordRepresentation;
        return createOkResponse(mutableData);
    }

    const storeEvict: DurableEnvironment['storeEvict'] = function(key: string) {
        // when a storeEvict is called immediately following a draft delete, ensure that it
        // only gets evicted from the in-memory store, we need to keep the record in durable store
        // until the action to delete it on the server succeeds.
        if (draftDeleteSet.has(key)) {
            draftDeleteSet.delete(key);
            store.evict(key);
            return;
        }
        env.storeEvict(key);
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: {
            value: dispatchResourceRequest,
        },
        storeEvict: {
            value: storeEvict,
        },
    });
}
