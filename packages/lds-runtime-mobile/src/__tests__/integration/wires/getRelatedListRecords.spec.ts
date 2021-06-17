import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { JSONStringify } from '../../../utils/language';
import { resetLuvioStore, setup } from './integrationTestSetup';
import mockGetRelatedListRecords from './data/list-ui-All-Related-Lists.json';
import { MockNimbusDurableStore } from '../../MockNimbusDurableStore';
import { flushPromises } from '../../testUtils';

describe('mobile runtime integration tests', () => {
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRelatedListRecords;
    let durableStore: MockNimbusDurableStore;

    beforeEach(async () => {
        ({ networkAdapter, getRelatedListRecords, durableStore } = await setup());
    });
    describe('getRelatedListRecords', () => {
        it('only triggers one durable notify change event once', async () => {
            const durableChangeListener = jest.fn();
            durableStore.registerOnChangedListenerWithBatchInfo(durableChangeListener);

            networkAdapter // Set the mock response
                .setMockResponse({
                    status: 200,
                    headers: {},
                    body: JSONStringify(mockGetRelatedListRecords),
                });

            const relatedListRecordsConfig = {
                parentRecordId: mockGetRelatedListRecords.listReference.inContextOfRecordId,
                relatedListId: mockGetRelatedListRecords.listReference.relatedListId,
                fields: mockGetRelatedListRecords.fields,
            };

            const snapshot = await getRelatedListRecords(relatedListRecordsConfig);
            expect(snapshot.state).toBe('Fulfilled');

            await flushPromises();

            expect(durableChangeListener).toBeCalledTimes(1);
            expect(networkAdapter.sentRequests.length).toEqual(1);

            await resetLuvioStore();

            const durableSnapshot = await getRelatedListRecords(relatedListRecordsConfig);
            expect(durableSnapshot.state).toBe('Fulfilled');

            await flushPromises();

            expect(networkAdapter.sentRequests.length).toEqual(1);
            expect(durableChangeListener).toBeCalledTimes(1);
        });
    });
});
