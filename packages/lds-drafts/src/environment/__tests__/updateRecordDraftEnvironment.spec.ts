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

describe('draft environment tests', () => {
    describe('updateRecord', () => {
        it('request gets enqueued with key as tag', async () => {
            const { durableStore, draftEnvironment, draftQueue } = setupDraftEnvironment();
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(draftQueue.enqueue).toBeCalledWith(request, STORE_KEY_RECORD, RECORD_ID);
        });

        it('record gets evicted from store prior to revival', async () => {
            const { durableStore, draftEnvironment, store } = setupDraftEnvironment();
            const spy = jest.spyOn(store, 'evict');
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(spy).toBeCalledTimes(1);
        });

        it('returns mutable data in the response', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment();
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
            const { durableStore, draftEnvironment, draftQueue, store } = setupDraftEnvironment();
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
            const { draftEnvironment, durableStore } = setupDraftEnvironment();

            durableStore.getEntries = jest.fn().mockRejectedValue(undefined);
            const request = {
                baseUri: '/services/data/v52.0',
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

        it('resolves draft id references in the body', async () => {
            const { durableStore, draftEnvironment, store, draftQueue } = setupDraftEnvironment();

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
                baseUri: '/services/data/v52.0',
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
    });
});
