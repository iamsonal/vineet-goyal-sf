import { karmaNetworkAdapter } from 'lds';
import {
    mockNetworkOnce,
    getMock as globalGetMock,
    setupElement,
    mockNetworkSequence,
} from 'test-util';
import { URL_BASE, expireRelatedListInfo } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListInfoBatch from '../lwc/related-list-info-batch';

const MOCK_PREFIX = 'wire/getRelatedListInfoBatch/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const parentObjectApiName = config.parentObjectApiName;
    const relatedListNames = config.relatedListNames;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListNames;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-info/batch/${parentObjectApiName}/${relatedListNames}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockNetworkFuzzy(config, mockData) {
    const parentObjectApiName = config.parentObjectApiName;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListNames;

    function hitCorrectParentObjectApiName(networkConfig) {
        return networkConfig.path.startsWith(
            `${URL_BASE}/related-list-info/batch/${parentObjectApiName}/`
        );
    }

    if (Array.isArray(mockData)) {
        mockNetworkSequence(
            karmaNetworkAdapter,
            sinon.match(hitCorrectParentObjectApiName),
            mockData
        );
    } else {
        mockNetworkOnce(karmaNetworkAdapter, sinon.match(hitCorrectParentObjectApiName), mockData);
    }
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
        mockNetwork(resourceConfig, mockData);

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
        mockNetwork(resourceConfig, mockData);

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
        mockNetwork(resourceConfig, [mockData, updatedMockData]);

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

    xit('returns cached result combined with network data in cache-miss scenario', async () => {
        //TODO: Re-enable once the wire can return combined network + cache responses
        const mockData1 = getMock('related-list-info-batch-Custom');
        const mockData2 = getMock('related-list-info-batch-Custom02');
        const mockDataCombined = getMock('related-list-info-batch-Custom-Both');

        const parentObjectApiName = mockData1.results[0].result.listReference.parentObjectApiName;
        const relatedListNames = mockData1.results.map(
            result => result.result.listReference.relatedListId
        );
        const resourceConfig = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames.join(','),
        };
        mockNetworkFuzzy(resourceConfig, [mockData1, mockData2]);

        const props1 = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: relatedListNames,
        };
        // first component should have the correct data from network.
        const element = await setupElement(props1, RelatedListInfoBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData1);
        expect(element.getWiredData()).toBeImmutable();

        // Setup second element.
        const combinedRelatedListNames = mockDataCombined.results.map(
            result => result.result.listReference.relatedListId
        );
        const props2 = {
            parentObjectApiName: parentObjectApiName,
            relatedListNames: combinedRelatedListNames,
        };
        // Second component should have the correct data from cache + network.
        const element2 = await setupElement(props2, RelatedListInfoBatch);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCombined);
        expect(element2.getWiredData()).toBeImmutable();
    });

    xdescribe('error cases', () => {
        // TODO: Test/Enable once the error parsing can be adding the the api.raml definitions
        // Params aren't reflected in error responses.
        const GOOD_PARENT_OBJECT_API_NAME = 'CwcCustom00__c';
        const BAD_RELATED_LIST_NAME = 'relatedListThatDoesntExist';
        const GOOD_RELATED_LIST_NAME = 'CwcCustom01s__r';

        it('emits to component with invalid relatedListApiNames', async () => {
            const mockData = getMock('related-list-info-batch-Error');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: BAD_RELATED_LIST_NAME,
            };
            mockNetwork(resourceConfig, mockData);

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
                relatedListNames: BAD_RELATED_LIST_NAME + ',' + GOOD_RELATED_LIST_NAME,
            };
            mockNetwork(resourceConfig, mockData);

            const props = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: [BAD_RELATED_LIST_NAME, GOOD_RELATED_LIST_NAME],
            };
            const element = await setupElement(props, RelatedListInfoBatch);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
            expect(element.getWiredData()).toBeImmutable();
        });

        it('emits to component with cached error data', async () => {
            const mockData = getMock('related-list-info-batch-Error');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: BAD_RELATED_LIST_NAME,
            };
            mockNetwork(resourceConfig, mockData);

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
            const mockError = getMock('related-list-info-batch-Error');
            const mockData = getMock('related-list-info-batch-Custom');
            const resourceConfig = {
                parentObjectApiName: GOOD_PARENT_OBJECT_API_NAME,
                relatedListNames: GOOD_RELATED_LIST_NAME,
            };
            mockNetwork(resourceConfig, [mockError, mockData]);

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
