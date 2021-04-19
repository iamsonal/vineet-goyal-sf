import { HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { getRecordKeyForId } from '../../utils/records';
import { DRAFT_RECORD_ID, RECORD_ID, STORE_KEY_DRAFT_RECORD } from '../../__tests__/test-utils';
import {
    createPatchRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    mockDurableStoreResponse,
    setupDraftEnvironment,
    STORE_KEY_FIELD__NAME,
    STORE_KEY_RECORD,
} from './test-utils';
import mockGetRecord from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import { clone } from '../../utils/clone';

describe('draft environment tests', () => {
    describe('updateRecord', () => {
        it('request gets enqueued with key as tag', async () => {
            const { durableStore, draftEnvironment, draftQueue } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(draftQueue.enqueue).toBeCalledWith(request, STORE_KEY_RECORD, RECORD_ID);
        });

        it('record gets evicted from store prior to revival', async () => {
            const { durableStore, draftEnvironment, store } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            const spy = jest.spyOn(store, 'evict');
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(spy).toBeCalledTimes(1);
        });

        it('returns mutable data in the response', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            const response = await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(
                request
            );
            expect(response.status).toBe(200);
            const record = response.body;
            expect(record.fields.Name.value).toBe(DEFAULT_NAME_FIELD_VALUE);
            const changedName = 'Jason';
            record.fields.Name.value = changedName;
            expect(record.fields.Name.value).toBe(changedName);
        });

        it('resolves draft ids in the base path', async () => {
            const { durableStore, draftEnvironment, draftQueue, store } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            const redirected2 = 'bar';
            const redirected2Key = getRecordKeyForId(redirected2);
            store.redirect(STORE_KEY_RECORD, redirected2Key);
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);

            const expectedRequest = {
                ...request,
                basePath: '/ui-api/records/bar',
                urlParams: { recordId: 'bar' },
            };
            expect(draftQueue.enqueue).toBeCalledWith(expectedRequest, redirected2Key, 'bar');
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });

            durableStore.getEntries = jest.fn().mockRejectedValue(undefined);
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'patch',
                body: {
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

        it('throws if durable store returns nothing after revive', async () => {
            const { draftEnvironment, durableStore, network } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            network.mockResolvedValue({
                body: clone(mockGetRecord),
                status: 200,
            });
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'patch',
                body: {
                    apiName: 'Account',
                    fields: {
                        Name: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'failed to synthesize draft response',
                },
                headers: {},
            });
        });

        it('throws if no object info is stored in the durable store for the prefix when attempting to call getRecord', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.reject({
                        body: { message: 'apiName is missing from the request body.' },
                        headers: {},
                        status: 400,
                    });
                },
            });
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'patch',
                body: {
                    fields: {
                        Name: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                headers: {},
                body: {
                    message: 'apiName is missing from the request body.',
                },
            });
        });

        it('resolves draft id references in the body', async () => {
            const { durableStore, draftEnvironment, store, draftQueue } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });

            store.redirect(STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD);
            durableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: {
                    data: {
                        apiName: DEFAULT_API_NAME,
                        childRelationships: {},
                        eTag: '',
                        fields: {
                            OwnerId: {
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
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
            });
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${DRAFT_RECORD_ID}`,
                method: 'patch',
                body: {
                    fields: {
                        OwnerId: DRAFT_RECORD_ID,
                    },
                },
                urlParams: {
                    recordId: DRAFT_RECORD_ID,
                },
                queryParams: {},
                headers: {},
            };
            await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(request);

            const expectedRequest = {
                ...request,
                basePath: `/ui-api/records/${RECORD_ID}`,
                body: {
                    fields: {
                        OwnerId: RECORD_ID,
                    },
                },
                urlParams: {
                    recordId: RECORD_ID,
                },
            };
            expect(draftQueue.enqueue).toBeCalledWith(expectedRequest, STORE_KEY_RECORD, RECORD_ID);
        });

        it('throws error when request has no recordId', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();
            mockDurableStoreResponse(durableStore);
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: '/ui-api/records/',
                method: 'patch',
                body: {
                    fields: {
                        OwnerId: DRAFT_RECORD_ID,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };

            await expect(
                draftEnvironment.dispatchResourceRequest<RecordRepresentation>(request)
            ).rejects.toEqual({
                body: {
                    message: 'missing record id in request',
                },
                status: 400,
                headers: {},
            });
        });

        it(`calls getRecord adapter when durable store missing enough info to synthesize response`, async () => {
            const { draftEnvironment, network, adapters, draftQueue } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            const request = createPatchRequest();
            network.mockResolvedValue({
                body: clone(mockGetRecord),
                status: 200,
            });
            const enqueueSpy = jest.spyOn(draftQueue, 'enqueue');

            const response = await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(
                request
            );

            expect(adapters.getRecord).toBeCalledTimes(1);
            expect(enqueueSpy).toBeCalledWith(request, STORE_KEY_RECORD, RECORD_ID);
            expect(network).toBeCalledTimes(1);
            expect(response.status).toBe(200);
            const record = response.body;
            expect(record.fields.Name.value).toBe(DEFAULT_NAME_FIELD_VALUE);
        });

        it(`throws error because it doesn't find a record in the store or online`, async () => {
            const { draftEnvironment, network } = setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.resolve('Account');
                },
            });
            const request = createPatchRequest();
            network.mockRejectedValue({
                body: {},
                status: HttpStatusCode.BadRequest,
            });

            await expect(
                draftEnvironment.dispatchResourceRequest<RecordRepresentation>(request)
            ).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'failed to synthesize draft response',
                },
                headers: {},
            });
        });
    });
});
