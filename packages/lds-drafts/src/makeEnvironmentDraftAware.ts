import {
    Environment,
    IngestPath,
    ResourceRequest,
    ResourceResponse,
    Store,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import { DurableEnvironment, DurableStore, ResponsePropertyRetriever } from '@luvio/environments';
import { ObjectCreate } from './utils/language';

import {
    getRecordFieldsFromRecordRequest,
    buildRecordSelector,
    extractRecordApiNameFromStore,
    shouldDraftResourceRequest,
    isRequestForDraftGetRecord,
    getRecordKeyFromRecordRequest,
    extractRecordIdFromRequestParams,
} from './utils/records';
import { DraftQueue, DraftQueueEvent, DraftQueueEventType } from './DraftQueue';
import {
    createBadRequestResponse,
    createDeletedResponse,
    createInternalErrorResponse,
    createOkResponse,
} from './DraftFetchResponse';
import { clone } from './utils/clone';
import { keyBuilderRecord, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { draftAwareHandleResponse } from './makeNetworkAdapterDraftAware';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';

export interface DraftIdMappingEntry {
    draftKey: string;
    canonicalKey: string;
}

export const DRAFT_ID_MAPPINGS_SEGMENT = 'DRAFT_ID_MAPPINGS';

// retain draft id mappings for 30 days
const MAPPING_TTL = 30 * 24 * 60 * 60 * 1000;

function createDraftMappingEntryKey(draftKey: string, canonicalKey: string) {
    return `DraftIdMapping::${draftKey}::${canonicalKey}`;
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    store: Store,
    draftQueue: DraftQueue,
    durableStore: DurableStore,
    // TODO - W-8291468 - have ingest get called a different way somehow
    ingestFunc: (
        record: RecordRepresentation,
        path: IngestPath,
        store: Store,
        timeStamp: number
    ) => void,
    generateId: (id: string) => string,
    isDraftId: (id: string) => boolean,
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[] = []
): Environment {
    const draftDeleteSet = new Set<string>();

    draftQueue.startQueue();
    function createSyntheticRecordResponse(
        key: string,
        fields: string[],
        allowUnfulfilledResponse: boolean
    ) {
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
        if (state !== 'Fulfilled' && state !== 'Stale' && allowUnfulfilledResponse !== true) {
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

    /**
     * Creates a synthetic response for a call to the getRecord endpoint if the
     * record is a draft record and has not been created yet
     * @param resourceRequest
     */
    function createSyntheticGetRecordResponse(resourceRequest: ResourceRequest) {
        const key = getRecordKeyFromRecordRequest(resourceRequest, generateId);

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

        // revive the modified record to the in-memory store
        return env.reviveRecordsToStore([key]).then(() => {
            const response = createSyntheticRecordResponse(key, fields, true);

            // the getRecord request might include fields that aren't set, instead of letting
            // the Reader think the snapshot is missing those fields and causing a network request
            // (which will result in a 404 since this draft-created ID doesn't exist on server) we
            // will fill in the requested fields with null values
            for (let i = 0, len = fields.length; i < len; i++) {
                const field = fields[i];
                if (response.body.fields[field] === undefined) {
                    response.body.fields[field] = { value: null, displayValue: null };
                }
            }

            return response;
        });
    }

    /**
     * Creates a ResourceRequest containing canonical record ids from a ResourceRequest containing draft record ids
     * @param request ResourceRequest containing draft id
     * @returns a new ResourceRequest which replaces draft id references with canonical id references. undefined if no canonical
     * key exists
     */
    function createRequestWithCanonicalRecordId(request: ResourceRequest) {
        const recordId = extractRecordIdFromRequestParams(request);
        if (recordId === undefined) {
            return undefined;
        }
        const recordKey = keyBuilderRecord({ recordId });
        const canonicalKey = env.storeGetCanonicalKey(recordKey);

        if (canonicalKey === recordKey) {
            // no mapping exists
            return undefined;
        }
        const canonicalId = extractRecordIdFromStoreKey(canonicalKey);
        if (canonicalId === undefined) {
            return undefined;
        }
        return {
            ...request,
            basePath: request.basePath.replace(recordId, canonicalId),
            urlParams: { ...request.urlParams, recordId: canonicalId },
        };
    }

    const resolveUnfulfilledSnapshot: DurableEnvironment['resolveUnfulfilledSnapshot'] = function<
        T
    >(
        request: ResourceRequest,
        snapshot: UnfulfilledSnapshot<T, unknown>
    ): Promise<ResourceResponse<T>> {
        if (isRequestForDraftGetRecord(request, isDraftId) === true) {
            const canonicalRequest = createRequestWithCanonicalRecordId(request);
            if (canonicalRequest !== undefined) {
                return env.resolveUnfulfilledSnapshot(canonicalRequest, snapshot);
            }
            return createSyntheticGetRecordResponse(request) as any;
        }

        return env.resolveUnfulfilledSnapshot(request, snapshot);
    };

    /**
     * Overrides the base environment's dispatchResourceRequest method only for calls to the record CUD endpoints
     * Instead of hitting the network, this environment delegates the mutation to the DraftQueue and returns an optimistic synthetic result
     * @param resourceRequest The resource request to fetch
     */
    const dispatchResourceRequest: DurableEnvironment['dispatchResourceRequest'] = function<T>(
        resourceRequest: ResourceRequest
    ) {
        if (isRequestForDraftGetRecord(resourceRequest, isDraftId) === true) {
            const canonicalRequest = createRequestWithCanonicalRecordId(resourceRequest);
            if (canonicalRequest !== undefined) {
                return env.dispatchResourceRequest(canonicalRequest);
            }
            return createSyntheticGetRecordResponse(resourceRequest);
        }

        if (shouldDraftResourceRequest(resourceRequest) === false) {
            return env.dispatchResourceRequest(resourceRequest);
        }

        const { method } = resourceRequest;

        // we tag the resource request with the store key for the affected request
        const key = getRecordKeyFromRecordRequest(resourceRequest, generateId);
        if (key === undefined) {
            return Promise.reject(
                createBadRequestResponse({
                    message:
                        method === 'post'
                            ? 'apiName missing from request body.'
                            : 'Unable to calculate RecordRepresentation key from ResourceRequest.',
                })
            );
        }

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
                return createSyntheticRecordResponse(key, fields, false);
            });
        });
    };

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

    // register for when the draft queue completes an upload so we can properly
    // update subscribers
    draftQueue.registerOnChangedListener(
        (event: DraftQueueEvent): Promise<void> => {
            if (event.type !== DraftQueueEventType.ActionCompleted) {
                return Promise.resolve();
            }
            const { action } = event;
            const { request, tag } = action;

            if (request.method === 'delete') {
                env.storeEvict(tag);
                env.storeBroadcast(env.rebuildSnapshot);
                return Promise.resolve();
            }
            return draftAwareHandleResponse(
                request,
                action.response,
                draftQueue,
                recordResponseRetrievers
            ).then(response => {
                const record = response.body as RecordRepresentation;
                const key = keyBuilderRecord({ recordId: record.id });
                const path = {
                    fullPath: key,
                    parent: null,
                    propertyName: null,
                };

                ingestFunc(record, path, store, Date.now());
                env.storeBroadcast(env.rebuildSnapshot);

                if (request.method === 'post') {
                    const draftKey = action.tag;
                    const { id } = response.body;
                    const canonicalKey = keyBuilderRecord({ recordId: id });

                    const expiration = new Date().getMilliseconds() + MAPPING_TTL;
                    const entry: DraftIdMappingEntry = {
                        draftKey,
                        canonicalKey,
                    };
                    const entryKey = createDraftMappingEntryKey(draftKey, canonicalKey);
                    return durableStore.setEntries(
                        {
                            [entryKey]: {
                                data: entry,
                                expiration: { fresh: expiration, stale: expiration },
                            },
                        },
                        DRAFT_ID_MAPPINGS_SEGMENT
                    );
                }
            });
        }
    );

    return ObjectCreate(env, {
        resolveUnfulfilledSnapshot: { value: resolveUnfulfilledSnapshot },
        dispatchResourceRequest: { value: dispatchResourceRequest },
        storeEvict: { value: storeEvict },
    });
}
