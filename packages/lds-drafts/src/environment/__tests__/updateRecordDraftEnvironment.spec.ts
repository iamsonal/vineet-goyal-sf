import { HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { getRecordKeyForId } from '../../utils/records';
import { DRAFT_RECORD_ID, RECORD_ID, STORE_KEY_DRAFT_RECORD } from '../../__tests__/test-utils';
import {
    createPatchRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    mockDurableStoreResponse,
    populateDurableStoreWithRecord,
    setupDraftEnvironment,
    STORE_KEY_RECORD,
} from './test-utils';
import mockGetRecord from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import { clone } from '../../utils/clone';
import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';

describe('draft environment tests', () => {
    describe('updateRecord', () => {
        it('request gets enqueued with key as tag', async () => {
            const { durableStore, draftEnvironment, draftQueue } = await setupDraftEnvironment();
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(draftQueue.enqueue).toBeCalledWith({
                data: request,
                tag: STORE_KEY_RECORD,
                targetId: RECORD_ID,
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('record gets evicted from store prior to revival', async () => {
            const { durableStore, draftEnvironment, store } = await setupDraftEnvironment();
            const spy = jest.spyOn(store, 'evict');
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(spy).toBeCalledTimes(1);
        });

        it('returns mutable data in the response', async () => {
            const { durableStore, draftEnvironment } = await setupDraftEnvironment();
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
            const { durableStore, draftEnvironment, draftQueue, store } =
                await setupDraftEnvironment();
            const redirected2 = '001SOMEDRAFTID';
            const redirected2Key = getRecordKeyForId(redirected2);
            store.redirect(STORE_KEY_RECORD, redirected2Key);
            await populateDurableStoreWithRecord(durableStore, redirected2Key, {
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                fields: {
                    Name: {
                        displayValue: DEFAULT_NAME_FIELD_VALUE,
                        value: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
                id: RECORD_ID,
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                weakEtag: -1,
            });
            const request = createPatchRequest();

            await draftEnvironment.dispatchResourceRequest(request);

            const expectedRequest = {
                ...request,
                basePath: `/ui-api/records/${redirected2}`,
                urlParams: { recordId: redirected2 },
            };
            expect(draftQueue.enqueue).toBeCalledWith({
                data: expectedRequest,
                tag: redirected2Key,
                targetId: redirected2,
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment();

            durableStore.getDenormalizedRecord = jest.fn().mockRejectedValue(undefined);
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
            const { draftEnvironment, durableStore, network } = await setupDraftEnvironment();
            network.mockResolvedValue({
                body: clone(mockGetRecord),
                status: 200,
            });

            const realReadFunction = durableStore.getDenormalizedRecord.bind(durableStore);
            durableStore.getDenormalizedRecord = jest
                .fn()
                .mockImplementationOnce((ids, segment) => realReadFunction(ids, segment))
                // mock the second call
                .mockResolvedValueOnce(undefined);

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
            const { draftEnvironment } = await setupDraftEnvironment({
                apiNameForPrefix: (_prefix: string) => {
                    return Promise.reject({
                        body: { message: 'apiName is missing from the request body.' },
                        headers: {},
                        status: 400,
                    });
                },
            });
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
            const { durableStore, draftEnvironment, store, draftQueue } =
                await setupDraftEnvironment();

            await populateDurableStoreWithRecord(durableStore, STORE_KEY_RECORD, {
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                fields: {
                    OwnerId: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
                id: RECORD_ID,
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                weakEtag: -1,
            });
            store.redirect(STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD);
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
            expect(draftQueue.enqueue).toBeCalledWith({
                data: expectedRequest,
                tag: STORE_KEY_RECORD,
                targetId: RECORD_ID,
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('throws error when request has no recordId', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment();
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
            const { draftEnvironment, network, adapters, draftQueue } =
                await setupDraftEnvironment();
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
            expect(enqueueSpy).toBeCalledWith({
                data: request,
                tag: STORE_KEY_RECORD,
                targetId: RECORD_ID,
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect(network).toBeCalledTimes(1);
            expect(response.status).toBe(200);
            const record = response.body;
            expect(record.fields.Name.value).toBe(DEFAULT_NAME_FIELD_VALUE);
        });

        it(`throws error because it doesn't find a record in the store or online`, async () => {
            const { draftEnvironment, network } = await setupDraftEnvironment();
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
                    message: 'cannot apply a draft to a record that is not cached',
                },
                headers: {},
            });
        });

        it('fails to update a record reference to a record that does not exist', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();

            const request = createPatchRequest();
            request.body.fields['OwnerId'] = 'foobar';

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'Referenced record foobar is not cached',
                },
                headers: {},
            });
        });
    });
});
