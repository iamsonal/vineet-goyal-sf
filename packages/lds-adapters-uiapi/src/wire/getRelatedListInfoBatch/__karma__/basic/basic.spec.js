import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireRelatedListInfo,
    mockGetRelatedListInfoNetwork,
    mockGetRelatedListInfoBatchNetwork,
} from 'uiapi-test-util';

import RelatedListInfoBatch from '../lwc/related-list-info-batch';
import RelatedListInfoSingle from '../../../getRelatedListInfo/__karma__/lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListInfoBatch/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid parentObjectApiName and relatedListNames and no data cached', async () => {
        const mockData = getMock('related-list-info-batch-Custom');

        const parentObjectApiName = mockData.results[0].result.listReference.parentObjectApiName;
        const relatedListNames = mockData.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfig = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames.join(','),
        };
        mockGetRelatedListInfoBatchNetwork(resourceConfig, mockData);

        const props = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames,
        };
        const element = await setupElement(props, RelatedListInfoBatch);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-info-batch-Custom');

        const parentObjectApiName = mockData.results[0].result.listReference.parentObjectApiName;
        const relatedListNames = mockData.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfig = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames.join(','),
        };
        mockGetRelatedListInfoBatchNetwork(resourceConfig, mockData);

        const props = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames,
        };
        // populate cache
        await setupElement(props, RelatedListInfoBatch);
        // second component should have the cached data without hitting network
        const element = await setupElement(props, RelatedListInfoBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns updated result when cached data is expired', async () => {
        const mockData = getMock('related-list-info-batch-Custom');
        const updatedMockData = getMock('related-list-info-batch-Custom');
        Object.assign(updatedMockData.results[0].result, {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        const parentObjectApiName = mockData.results[0].result.listReference.parentObjectApiName;
        const relatedListNames = mockData.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfig = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames.join(','),
        };
        mockGetRelatedListInfoBatchNetwork(resourceConfig, [mockData, updatedMockData]);

        const props = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames,
        };
        // populate cache
        await setupElement(props, RelatedListInfoBatch);

        expireRelatedListInfo();
        // second component should have the updated data by hitting network
        const element = await setupElement(props, RelatedListInfoBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns cached result combined with network data in cache-miss scenario', async () => {
        const mockData1 = getMock('related-list-info-batch-Custom');
        const mockDataCombined = getMock('related-list-info-batch-Custom-Both');

        const parentObjectApiName = mockData1.results[0].result.listReference.parentObjectApiName;
        const relatedListNames1 = mockData1.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfig1 = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames1.join(','),
        };
        mockGetRelatedListInfoBatchNetwork(resourceConfig1, mockData1);

        const props1 = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames1,
        };
        // first component should have the correct data from network.
        const element = await setupElement(props1, RelatedListInfoBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData1);
        expect(element.getWiredData()).toBeImmutable();

        // Setup second element.
        const combinedRelatedListNames = mockDataCombined.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfigCombined = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: combinedRelatedListNames.join(','),
        };
        mockGetRelatedListInfoBatchNetwork(resourceConfigCombined, mockDataCombined);
        const props2 = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: combinedRelatedListNames,
        };
        // Second component should have the correct data from cache + network.
        const element2 = await setupElement(props2, RelatedListInfoBatch);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCombined);
        expect(element2.getWiredData()).toBeImmutable();
    });

    it('returns cached result when single wires match requested data', async () => {
        const mockData1 = getMock('related-list-info-batch-Custom');
        const mockData2 = getMock('related-list-info-batch-Custom02');
        const mockDataCombined = getMock('related-list-info-batch-Custom-Both');

        const parentObjectApiName = mockData1.results[0].result.listReference.parentObjectApiName;
        const relatedListName1 = mockData1.results[0].result.listReference.relatedListId;
        const relatedListName2 = mockData2.results[0].result.listReference.relatedListId;
        const resourceConfig1 = {
            parentObjectApiName: parentObjectApiName,
            relatedListId: relatedListName1,
        };
        const resourceConfig2 = {
            parentObjectApiName: parentObjectApiName,
            relatedListId: relatedListName2,
        };
        mockGetRelatedListInfoNetwork(resourceConfig1, mockData1.results[0].result);
        mockGetRelatedListInfoNetwork(resourceConfig2, mockData2.results[0].result);

        // Setup single components to propagate the cache
        await setupElement(resourceConfig1, RelatedListInfoSingle);
        await setupElement(resourceConfig2, RelatedListInfoSingle);

        // Setup batch element.
        const combinedRelatedListNames = mockDataCombined.results.map(
            result => result.result.listReference.relatedListId
        );
        const batchProps = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: combinedRelatedListNames,
        };
        // batch component should have the correct data from cache
        const batchElement = await setupElement(batchProps, RelatedListInfoBatch);
        expect(batchElement.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCombined);
        expect(batchElement.getWiredData()).toBeImmutable();
    });

    describe('error cases', () => {
        const GOOD_PARENT_OBJECT_API_NAME = 'CwcCustom00__c';
        const BAD_RELATED_LIST_NAME = 'relatedListThatDoesntExist';
        const GOOD_RELATED_LIST_NAME = 'CwcCustom01s__r';

        it('emits to component with invalid relatedListApiNames', async () => {
            const mockData = getMock('related-list-info-batch-Error');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: BAD_RELATED_LIST_NAME,
            };
            mockGetRelatedListInfoBatchNetwork(resourceConfig, mockData);

            const props = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: [BAD_RELATED_LIST_NAME],
            };
            const element = await setupElement(props, RelatedListInfoBatch);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
            expect(element.getWiredData()).toBeImmutable();
        });

        it('emits to component with mix of valid and invalid relatedListApiNames', async () => {
            const mockData = getMock('related-list-info-batch-Mixed-Error');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: GOOD_RELATED_LIST_NAME + ',' + BAD_RELATED_LIST_NAME,
            };
            mockGetRelatedListInfoBatchNetwork(resourceConfig, mockData);

            const props = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: [GOOD_RELATED_LIST_NAME, BAD_RELATED_LIST_NAME],
            };
            const element = await setupElement(props, RelatedListInfoBatch);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
            expect(element.getWiredData()).toBeImmutable();
        });

        it('emits to component with cached error data', async () => {
            const mockData = getMock('related-list-info-batch-Missing');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: BAD_RELATED_LIST_NAME,
            };
            mockGetRelatedListInfoBatchNetwork(resourceConfig, mockData);

            const props = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: [BAD_RELATED_LIST_NAME],
            };

            // Get data into the cache
            await setupElement(props, RelatedListInfoBatch);

            // Network is mocked only once, should still retrieve data here.
            const element = await setupElement(props, RelatedListInfoBatch);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
            expect(element.getWiredData()).toBeImmutable();
        });

        it('should retreive actual data after error response cache expired', async () => {
            const mockError = getMock('related-list-info-batch-Missing');
            const mockData = getMock('related-list-info-batch-Custom');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: GOOD_RELATED_LIST_NAME,
            };
            mockGetRelatedListInfoBatchNetwork(resourceConfig, [mockError, mockData]);

            const props = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: [GOOD_RELATED_LIST_NAME],
            };

            // Get error data into the cache
            const errorElement = await setupElement(props, RelatedListInfoBatch);
            expect(errorElement.getWiredData()).toEqualSnapshotWithoutEtags(mockError);
            expect(errorElement.getWiredData()).toBeImmutable();

            // Cache bust
            expireRelatedListInfo();

            // Should get the real data now
            const element = await setupElement(props, RelatedListInfoBatch);
            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
            expect(element.getWiredData()).toBeImmutable();
        });
    });
});
