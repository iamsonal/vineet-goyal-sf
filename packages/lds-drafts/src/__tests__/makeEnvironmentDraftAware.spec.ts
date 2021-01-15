import { Environment, Store } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
} from '@salesforce/lds-uiapi-record-utils';
import { DraftQueue } from '../DraftQueue';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';
import {
    createDeleteRequest,
    createPatchRequest,
    DEFAULT_NAME_FIELD_VALUE,
    RECORD_ID,
    STORE_KEY_FIELD__NAME,
    STORE_KEY_RECORD,
} from './test-utils';

const DEFAULT_API_NAME = 'Account';

function setup(
    setupOptions: {
        mockNetworkResponse?: any;
    } = {}
) {
    const { mockNetworkResponse } = setupOptions;

    const store = new Store();
    const network = jest.fn().mockResolvedValue(mockNetworkResponse ?? {});
    const durableStore: DurableStore = {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
    };
    const draftQueue: DraftQueue = {
        enqueue: jest.fn().mockResolvedValue(undefined),
        getActionsForTags: jest.fn(),
        registerDraftQueueCompletedListener: jest.fn(),
        processNextAction: jest.fn(),
    };

    const baseEnvironment = makeDurable(new Environment(store, network), durableStore);
    const draftEnvironment = makeEnvironmentDraftAware(
        baseEnvironment,
        store,
        draftQueue,
        (_record: any, _path: any, _store: any, _timestamp: any) => {},
        (_prefix: string) => {
            return 'generatedId';
        },
        _id => true,
        undefined
    );
    return {
        store,
        network,
        durableStore,
        draftQueue,
        baseEnvironment,
        draftEnvironment,
    };
}

function mockDurableStoreResponse(durableStore: DurableStore) {
    durableStore.getEntries = jest.fn().mockResolvedValue({
        [STORE_KEY_RECORD]: {
            data: {
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                fields: {
                    Name: {
                        __ref: STORE_KEY_FIELD__NAME,
                    },
                },
                id: RECORD_ID,
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                weakEtag: -1,
            },
        },

        [STORE_KEY_FIELD__NAME]: {
            data: {
                displayValue: DEFAULT_NAME_FIELD_VALUE,
                value: DEFAULT_NAME_FIELD_VALUE,
            },
        },
    });
}

describe('makeEnvironmentDraftAware', () => {
    describe('dispatchResourceRequest', () => {
        it('does not intercept non record endpoints', async () => {
            const { draftEnvironment, network } = setup();
            await draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/not-record-endpoint`,
                method: 'patch',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
        });
        it('does not intercept record get endpoint', () => {
            const { draftEnvironment, network } = setup();
            draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'get',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
        });
    });

    describe('dispatchResourceRequestWithResponseHandler', () => {
        describe('post', () => {
            it('rejects when apiName is not in the config', async () => {
                const { draftEnvironment } = setup();
                const { rejects } = await expect(
                    draftEnvironment.dispatchResourceRequest({
                        baseUri: '/services/data/v52.0',
                        basePath: `/ui-api/records/${RECORD_ID}`,
                        method: 'post',
                        body: {
                            fields: {
                                Name: DEFAULT_NAME_FIELD_VALUE,
                            },
                        },
                        urlParams: {},
                        queryParams: {},
                        headers: {},
                    })
                );
                rejects.toMatchObject({
                    body: {
                        message: 'apiName missing from request body.',
                    },
                    headers: {},
                    status: 400,
                });
            });
            it('request gets enqueued with key as tag', async () => {
                const { draftEnvironment, draftQueue, durableStore } = setup();
                let assignedDraftId = '';
                let assignedDraftIdStoreKey = '';
                durableStore.getEntries = jest.fn().mockImplementation((keys: string[]) => {
                    assignedDraftIdStoreKey = keys[0];
                    assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                    const nameKey = buildRecordFieldStoreKey(assignedDraftIdStoreKey, 'Name');
                    return Promise.resolve({
                        [assignedDraftIdStoreKey]: {
                            data: {
                                apiName: DEFAULT_API_NAME,
                                childRelationships: {},
                                eTag: '',
                                fields: {
                                    Name: {
                                        __ref: nameKey,
                                    },
                                },
                                id: assignedDraftId,
                                lastModifiedById: null,
                                lastModifiedDate: null,
                                recordTypeId: null,
                                recordTypeInfo: null,
                                systemModstamp: null,
                                weakEtag: -1,
                            },
                        },

                        [nameKey]: {
                            data: {
                                displayValue: DEFAULT_NAME_FIELD_VALUE,
                                value: DEFAULT_NAME_FIELD_VALUE,
                            },
                        },
                    });
                });
                const request = {
                    baseUri: '/services/data/v52.0',
                    basePath: `/ui-api/records/${RECORD_ID}`,
                    method: 'post',
                    body: {
                        apiName: DEFAULT_API_NAME,
                        fields: {
                            Name: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    urlParams: {},
                    queryParams: {},
                    headers: {},
                };

                await draftEnvironment.dispatchResourceRequest(request);

                expect(draftQueue.enqueue).toBeCalledWith(request, assignedDraftIdStoreKey);
            });

            it('throws if record cannot be revived', async () => {
                const { draftEnvironment, durableStore } = setup();

                durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
                const request = {
                    baseUri: '/services/data/v52.0',
                    basePath: `/ui-api/records/${RECORD_ID}`,
                    method: 'post',
                    body: {
                        apiName: DEFAULT_API_NAME,
                        fields: {
                            Name: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    urlParams: {},
                    queryParams: {},
                    headers: {},
                };

                await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                    status: 500,
                    headers: {},
                });
            });

            it('returns mutable data in the response', async () => {
                const { draftEnvironment, durableStore } = setup();
                let assignedDraftId = '';
                let assignedDraftIdStoreKey = '';
                durableStore.getEntries = jest.fn().mockImplementation((keys: string[]) => {
                    assignedDraftIdStoreKey = keys[0];
                    assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                    const nameKey = buildRecordFieldStoreKey(assignedDraftIdStoreKey, 'Name');
                    return Promise.resolve({
                        [assignedDraftIdStoreKey]: {
                            data: {
                                apiName: DEFAULT_API_NAME,
                                childRelationships: {},
                                eTag: '',
                                fields: {
                                    Name: {
                                        __ref: nameKey,
                                    },
                                },
                                id: assignedDraftId,
                                lastModifiedById: null,
                                lastModifiedDate: null,
                                recordTypeId: null,
                                recordTypeInfo: null,
                                systemModstamp: null,
                                weakEtag: -1,
                            },
                        },

                        [nameKey]: {
                            data: {
                                displayValue: DEFAULT_NAME_FIELD_VALUE,
                                value: DEFAULT_NAME_FIELD_VALUE,
                            },
                        },
                    });
                });
                const request = {
                    baseUri: '/services/data/v52.0',
                    basePath: `/ui-api/records`,
                    method: 'post',
                    body: {
                        apiName: DEFAULT_API_NAME,
                        fields: {
                            Name: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    urlParams: {},
                    queryParams: {},
                    headers: {},
                };

                const result = await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(
                    request
                );

                const record = result.body;
                expect(record.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
                const changedName = 'Jason';
                record.fields.Name.value = changedName;
                expect(record.fields.Name.value).toEqual(changedName);
            });
        });

        describe('update', () => {
            it('request gets enqueued with key as tag', async () => {
                const { durableStore, draftEnvironment, draftQueue } = setup();
                mockDurableStoreResponse(durableStore);
                const request = createPatchRequest();
                await draftEnvironment.dispatchResourceRequest(request);
                expect(draftQueue.enqueue).toBeCalledWith(request, STORE_KEY_RECORD);
            });

            it('record gets evicted from store prior to revival', async () => {
                const { durableStore, draftEnvironment, store } = setup();
                const spy = jest.spyOn(store, 'evict');
                mockDurableStoreResponse(durableStore);
                const request = createPatchRequest();
                await draftEnvironment.dispatchResourceRequest(request);
                expect(spy).toBeCalledTimes(1);
            });

            it('throws if record cannot be revived', async () => {
                const { durableStore, draftEnvironment } = setup();
                durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
                const request = createPatchRequest();
                await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                    status: 500,
                    headers: {},
                });
            });

            it('returns mutable data in the response', async () => {
                const { durableStore, draftEnvironment } = setup();
                mockDurableStoreResponse(durableStore);
                const request = createPatchRequest();
                const response = await draftEnvironment.dispatchResourceRequest<
                    RecordRepresentation
                >(request);
                expect(response.status).toBe(200);
                const record = response.body;
                expect(record.fields.Name.value).toBe(DEFAULT_NAME_FIELD_VALUE);
                const changedName = 'Jason';
                record.fields.Name.value = changedName;
                expect(record.fields.Name.value).toBe(changedName);
            });
        });
        describe('delete', () => {
            it('request gets enqueued with key as tag', async () => {
                const { durableStore, draftEnvironment, draftQueue } = setup();
                mockDurableStoreResponse(durableStore);
                const request = createDeleteRequest();
                await draftEnvironment.dispatchResourceRequest(request);
                expect(draftQueue.enqueue).toBeCalledWith(request, STORE_KEY_RECORD);
            });
        });
    });

    describe('storeEvict', () => {
        it('calling storeEvict after a delete request does not evict from the durable store', async () => {
            const { durableStore, draftEnvironment, store } = setup();
            store.records[STORE_KEY_RECORD] = {};
            mockDurableStoreResponse(durableStore);
            const request = createDeleteRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(store.records[STORE_KEY_RECORD]).toBeDefined();
            draftEnvironment.storeEvict(STORE_KEY_RECORD);
            expect(store.records[STORE_KEY_RECORD]).toBeUndefined();
            expect(durableStore.evictEntries).toBeCalledTimes(0);
        });
    });
});
