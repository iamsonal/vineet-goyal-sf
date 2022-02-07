import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import { getRelatedListRecordsBatch_imperative } from 'lds-adapters-uiapi';
import {
    expireRecords,
    expireRelatedListRecordCollection,
    mockGetRelatedListRecordsBatchNetwork,
    mockGetRelatedListRecordsNetworkPost,
    extractRelatedListsBatchParamsFromMockData,
} from 'uiapi-test-util';

import RelatedListRecordsBatch from '../lwc/related-list-records-batch-basic';
import RelatedListRecordsSingle from '../../../getRelatedListRecords/__karma__/lwc/related-list-basic';
// import RelatedListRecords from '../../getRelatedListRecords/lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListRecordsBatch/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

async function createSingleComponentsFromBatchData(mockData) {
    const individualResults = mockData.results.map((item) => item.result);
    // Setup all our results to be retrieved from the single version of the wire.
    for (const relatedListRecordCollection of individualResults) {
        const singleResourceConfig = {
            uriParams: {
                parentRecordId: relatedListRecordCollection.listReference.inContextOfRecordId,
                relatedListId: relatedListRecordCollection.listReference.relatedListId,
            },
            body: {
                fields: relatedListRecordCollection.fields,
                optionalFields: relatedListRecordCollection.optionalFields,
                pageSize: relatedListRecordCollection.pageSize,
                sortBy: relatedListRecordCollection.sortBy,
            },
        };
        const props = {
            parentRecordId: relatedListRecordCollection.listReference.inContextOfRecordId,
            relatedListId: relatedListRecordCollection.listReference.relatedListId,
            fields: relatedListRecordCollection.fields,
            optionalFields: relatedListRecordCollection.optionalFields,
            pageSize: relatedListRecordCollection.pageSize,
            sortBy: relatedListRecordCollection.sortBy,
        };
        mockGetRelatedListRecordsNetworkPost(singleResourceConfig, relatedListRecordCollection);
        await setupElement(props, RelatedListRecordsSingle);
    }
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListIds', async () => {
        const mockData = getMock('related-list-records-standard-defaults-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);

        mockGetRelatedListRecordsBatchNetwork(params, mockData);

        const element = await setupElement(params, RelatedListRecordsBatch);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data with valid parameters', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);

        mockGetRelatedListRecordsBatchNetwork(params, mockData);
        const element = await setupElement(params, RelatedListRecordsBatch);

        const wireData = element.getWiredData();
        expect(wireData).toEqualSyntheticCursorListSnapshot(mockData);
    });
});

describe('batching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);
        mockGetRelatedListRecordsBatchNetwork(params, mockData);

        // populate cache
        await setupElement(params, RelatedListRecordsBatch);
        // second component should have the cached data without hitting network
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('returns updated result when cached data is expired', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const updatedMockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);
        Object.assign(updatedMockData.results[0].result.records[0], {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        mockGetRelatedListRecordsBatchNetwork(params, [mockData, updatedMockData]);

        // populate cache
        await setupElement(params, RelatedListRecordsBatch);

        expireRecords();
        // second component should have the updated data by hitting network
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('returns updated result when cached data is expired with no record linking', async () => {
        const mockData = getMock('related-list-records-standard-defaults-Custom');
        const noRecordsMockData = getMock('related-list-no-records-Custom');

        const params = extractRelatedListsBatchParamsFromMockData(mockData);

        mockGetRelatedListRecordsBatchNetwork(params, [noRecordsMockData, mockData]);

        // populate cache
        await setupElement(params, RelatedListRecordsBatch);

        expireRelatedListRecordCollection();
        // second component should have the updated data by hitting network
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    // should provide a cache hit for existing single data
    // 2 single wire calls
    // 1 batch call shouldn't hit network
    // Expect data on batch call without a network mock provided
    it('returns cached result when cached data from single is available', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const batchComponentParams = extractRelatedListsBatchParamsFromMockData(mockData);

        await createSingleComponentsFromBatchData(mockData);

        // // second component should have the cached data without hitting network
        const element = await setupElement(batchComponentParams, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    // 1 single wire calls
    // 1 batch call
    // expect data on batch call with a network mock
    it('returns combined cache and network result when cached data from single is available', async () => {
        const partialMockData = getMock('related-list-records-standard-fields-Custom');
        partialMockData.results.splice(0, 1);
        await createSingleComponentsFromBatchData(partialMockData);

        const mockData = getMock('related-list-records-standard-fields-Custom');
        const batchComponentParams = extractRelatedListsBatchParamsFromMockData(mockData);

        mockGetRelatedListRecordsBatchNetwork(batchComponentParams, mockData);
        const element = await setupElement(batchComponentParams, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });
});

describe('error cases', () => {
    it('adapter handles error responses.', async () => {
        const mockData = getMock('related-list-records-standard-error-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);
        params.relatedListParameters.push({
            relatedListId: 'missingRelatedList',
        });

        mockGetRelatedListRecordsBatchNetwork(params, mockData);
        const element = await setupElement(params, RelatedListRecordsBatch);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it("emits to component twice with error data - 400 status doesn't cache", async () => {
        const mockErrorData = getMock('related-list-records-standard-error-Custom');
        const mockFullData = getMock('related-list-records-standard-fields-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockFullData);
        mockGetRelatedListRecordsBatchNetwork(params, [mockErrorData, mockFullData]);

        // Get data into the cache
        const errorElement = await setupElement(params, RelatedListRecordsBatch);
        expect(errorElement.getWiredData()).toEqualSyntheticCursorListSnapshot(mockErrorData);

        // Network is mocked only once, should still retrieve data here.
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockFullData);
    });

    it('should retrieve actual data after error response cache expired', async () => {
        const mockError = getMock('related-list-records-standard-error-Custom');
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractRelatedListsBatchParamsFromMockData(mockData);
        mockGetRelatedListRecordsBatchNetwork(params, [mockError, mockData]);

        // Get error data into the cache
        const errorElement = await setupElement(params, RelatedListRecordsBatch);
        expect(errorElement.getWiredData()).toEqualSyntheticCursorListSnapshot(mockError);

        // Cache bust
        expireRecords();

        // Should get the real data now
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    describe('gack cases', () => {
        it('gets data with valid parameters', async () => {
            const mockData = getMock('related-list-records-pagination');
            const params = extractRelatedListsBatchParamsFromMockData(mockData);

            mockGetRelatedListRecordsBatchNetwork(params, mockData);
            const element = await setupElement(params, RelatedListRecordsBatch);

            const wireData = element.getWiredData();
            expect(wireData).toEqualSyntheticCursorListSnapshot(mockData);
        });
    });

    describe('getRelatedListRecordsBatch_imperative', () => {
        it('uses caller-supplied cache policy', async () => {
            const mock1 = getMock('related-list-records-standard-fields-Custom');
            const mock2 = getMock('related-list-records-standard-fields-Custom');
            mock2.results[0].result.records[0].fields.Name.value = 'NewName';
            mock2.results[0].result.records[0].eTag = '33f99fd969583cd3a1b31ed8b5121e62';

            const config = extractRelatedListsBatchParamsFromMockData(mock1);

            mockGetRelatedListRecordsBatchNetwork(config, [mock1, mock2]);

            const callback = jasmine.createSpy();

            // populate cache with mock1
            getRelatedListRecordsBatch_imperative.invoke(config, undefined, callback);
            await flushPromises();

            callback.calls.reset();

            // should emit mock1 from cache, then make network call & emit mock2
            getRelatedListRecordsBatch_imperative.subscribe(
                config,
                { cachePolicy: { type: 'cache-and-network' } },
                callback
            );
            await flushPromises();

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback.calls.argsFor(0)[0].data).toEqualSyntheticCursorListSnapshot(mock1);
            expect(callback.calls.argsFor(1)[0].data).toEqualSyntheticCursorListSnapshot(mock2);
        });
    });
});
