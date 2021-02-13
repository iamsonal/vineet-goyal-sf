import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    createPatchRequest,
    DEFAULT_NAME_FIELD_VALUE,
    mockDurableStoreResponse,
    setupDraftEnvironment,
    STORE_KEY_RECORD,
} from './test-utils';

describe('draft environment tests', () => {
    describe('updateRecord', () => {
        it('request gets enqueued with key as tag', async () => {
            const { durableStore, draftEnvironment, draftQueue } = setupDraftEnvironment();
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(draftQueue.enqueue).toBeCalledWith(request, STORE_KEY_RECORD);
        });

        it('record gets evicted from store prior to revival', async () => {
            const { durableStore, draftEnvironment, store } = setupDraftEnvironment();
            const spy = jest.spyOn(store, 'evict');
            mockDurableStoreResponse(durableStore);
            const request = createPatchRequest();
            await draftEnvironment.dispatchResourceRequest(request);
            expect(spy).toBeCalledTimes(1);
        });

        it('throws if record cannot be revived', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment();
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const request = createPatchRequest();
            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
            });
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
    });
});
