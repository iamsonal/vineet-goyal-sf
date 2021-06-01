import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';
import {
    createDeleteRequest,
    mockDurableStoreResponse,
    RECORD_ID,
    setupDraftEnvironment,
    STORE_KEY_RECORD,
} from './test-utils';

describe('draft environment tests', () => {
    describe('deleteRecord', () => {
        describe('storeEvict', () => {
            it('calling storeEvict after a delete request does not evict from the durable store', async () => {
                const { durableStore, draftEnvironment, store } = setupDraftEnvironment();
                store.records[STORE_KEY_RECORD] = {};
                mockDurableStoreResponse(durableStore);
                const evictSpy = jest.spyOn(durableStore, 'evictEntries');

                const request = createDeleteRequest();
                await draftEnvironment.dispatchResourceRequest(request);
                expect(store.records[STORE_KEY_RECORD]).toBeDefined();
                draftEnvironment.storeEvict(STORE_KEY_RECORD);
                expect(store.records[STORE_KEY_RECORD]).toBeUndefined();
                expect(evictSpy).toBeCalledTimes(0);
            });

            it('request gets enqueued with key as tag', async () => {
                const { durableStore, draftEnvironment, draftQueue } = setupDraftEnvironment();
                mockDurableStoreResponse(durableStore);
                const request = createDeleteRequest();
                await draftEnvironment.dispatchResourceRequest(request);
                expect(draftQueue.enqueue).toBeCalledWith({
                    data: request,
                    tag: STORE_KEY_RECORD,
                    targetId: RECORD_ID,
                    handler: LDS_ACTION_HANDLER_ID,
                });
            });
        });
    });
});
