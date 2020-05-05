import { getMock as globalGetMock, setupElement } from 'test-util';

import RelatedListRecordsBatch from '../lwc/related-list-records-batch-basic';
import RelatedListRecordsSingle from '../../../getRelatedListRecords/__karma__/lwc/related-list-basic';
// import RelatedListRecords from '../../getRelatedListRecords/lwc/related-list-basic';
import {
    expireRecords,
    mockGetRelatedListRecordsBatchNetwork,
    mockGetRelatedListRecordsNetwork,
} from '../../../../../karma/uiapi-test-util';

const MOCK_PREFIX = 'wire/getRelatedListRecordsBatch/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function convertParamsToResourceParams(parameters) {
    var relatedListIds = [];
    var fields = [];
    var optionalFields = [];
    var pageSize = [];
    var sortBy = [];
    parameters.relatedLists.forEach(relatedList => {
        relatedListIds.push(relatedList.relatedListId);
        if (relatedList.fields && relatedList.fields.length) {
            fields.push(relatedList.relatedListId + ':' + relatedList.fields.join());
        }
        if (relatedList.optionalFields && relatedList.optionalFields.length) {
            optionalFields.push(
                relatedList.relatedListId + ':' + relatedList.optionalFields.join()
            );
        }
        if (relatedList.pageSize) {
            pageSize.push(relatedList.relatedListId + ':' + relatedList.pageSize);
        }
        if (!!relatedList.sortBy && relatedList.sortBy.length) {
            sortBy.push(relatedList.relatedListId + ':' + relatedList.sortBy.join());
        }
    });
    const fieldsParam = fields.join(';');
    const optionalFieldsParam = optionalFields.join(';');
    const pageSizeParam = pageSize.join(';');
    const sortByParam = sortBy.join(';');

    return {
        parentRecordId: parameters.parentRecordId,
        relatedListIds: relatedListIds,
        fields: fieldsParam,
        optionalFields: optionalFieldsParam,
        pageSize: pageSizeParam,
        sortBy: sortByParam,
    };
}

function extractParamsFromMockData(mockData) {
    if (mockData.results && mockData.results.length > 0) {
        const parentRecordId = mockData.results.find(item => item.result.listReference).result
            .listReference.inContextOfRecordId;
        const relatedLists = mockData.results
            .filter(result => result.result.listReference)
            .map(item => {
                return {
                    relatedListId: item.result.listReference.relatedListId,
                    fields: item.result.fields,
                    optionalFields: item.result.optionalFields,
                    pageSize: item.result.pageSize,
                    sortBy: item.result.sortBy,
                };
            });
        return {
            parentRecordId: parentRecordId,
            relatedLists: relatedLists,
        };
    } else {
        return {};
    }
}

async function createSingleComponentsFromBatchData(mockData) {
    const individualResults = mockData.results.map(item => item.result);
    // Setup all our results to be retrieved from the single version of the wire.
    for (const relatedListRecordCollection of individualResults) {
        const singleResourceConfig = {
            parentRecordId: relatedListRecordCollection.listReference.inContextOfRecordId,
            relatedListId: relatedListRecordCollection.listReference.relatedListId,
            fields: relatedListRecordCollection.fields,
            optionalFields: relatedListRecordCollection.optionalFields,
            pageSize: relatedListRecordCollection.pageSize,
            pageToken: '0',
            sortBy: relatedListRecordCollection.sortBy,
        };
        const props = {
            parentRecordId: relatedListRecordCollection.listReference.inContextOfRecordId,
            relatedListId: relatedListRecordCollection.listReference.relatedListId,
            fields: relatedListRecordCollection.fields,
            optionalFields: relatedListRecordCollection.optionalFields,
            pageSize: relatedListRecordCollection.pageSize,
            pageToken: '0',
            sortBy: relatedListRecordCollection.sortBy,
        };
        mockGetRelatedListRecordsNetwork(singleResourceConfig, relatedListRecordCollection);
        await setupElement(props, RelatedListRecordsSingle);
    }
}

function stripExtraFieldsAndPageUrl(mockData) {
    mockData.results.forEach(singleResult => {
        if (singleResult.result.records && singleResult.result.records.length > 0) {
            const requestedFields = singleResult.result.fields.concat(
                singleResult.result.optionalFields
            );
            singleResult.result.records.forEach(record => {
                Object.keys(record.fields).forEach(key => {
                    if (!(requestedFields.indexOf(key) > -1)) {
                        delete record.fields[key];
                    }
                });
            });
        }
    });
    return mockData;
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListIds', async () => {
        const mockData = getMock('related-list-records-standard-defaults-Custom');
        const params = extractParamsFromMockData(mockData);
        const resourceConfig = convertParamsToResourceParams(params);

        mockGetRelatedListRecordsBatchNetwork(resourceConfig, mockData);

        const element = await setupElement(params, RelatedListRecordsBatch);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
    });

    it('gets data with valid parameters', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractParamsFromMockData(mockData);
        const resourceConfig = convertParamsToResourceParams(params);

        mockGetRelatedListRecordsBatchNetwork(resourceConfig, mockData);
        const element = await setupElement(params, RelatedListRecordsBatch);

        const wireData = element.getWiredData();
        expect(wireData).toEqualSnapshotWithoutEtags(stripExtraFieldsAndPageUrl(mockData));
    });
});

describe('batching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractParamsFromMockData(mockData);
        const resourceConfig = convertParamsToResourceParams(params);
        mockGetRelatedListRecordsBatchNetwork(resourceConfig, mockData);

        // populate cache
        await setupElement(params, RelatedListRecordsBatch);
        // second component should have the cached data without hitting network
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns updated result when cached data is expired', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const updatedMockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractParamsFromMockData(mockData);
        const resourceConfig = convertParamsToResourceParams(params);
        Object.assign(updatedMockData.results[0].result.records[0], {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        mockGetRelatedListRecordsBatchNetwork(resourceConfig, [mockData, updatedMockData]);

        // populate cache
        await setupElement(params, RelatedListRecordsBatch);

        expireRecords();
        // second component should have the updated data by hitting network
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
        expect(element.getWiredData()).toBeImmutable();
    });

    // should provide a cache hit for existing single data
    // 2 single wire calls
    // 1 batch call shouldn't hit network
    // Expect data on batch call without a network mock provided
    it('returns cached result when cached data from single is available', async () => {
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const batchComponentParams = extractParamsFromMockData(mockData);

        await createSingleComponentsFromBatchData(mockData);

        // // second component should have the cached data without hitting network
        const element = await setupElement(batchComponentParams, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
        expect(element.getWiredData()).toBeImmutable();
    });

    // 1 single wire calls
    // 1 batch call
    // expect data on batch call with a network mock
    it('returns combined cache and network result when cached data from single is available', async () => {
        const partialMockData = getMock('related-list-records-standard-fields-Custom');
        partialMockData.results.splice(0, 1);
        await createSingleComponentsFromBatchData(partialMockData);

        const mockData = getMock('related-list-records-standard-fields-Custom');
        const batchComponentParams = extractParamsFromMockData(mockData);
        const batchResourceConfig = convertParamsToResourceParams(batchComponentParams);

        mockGetRelatedListRecordsBatchNetwork(batchResourceConfig, mockData);
        const element = await setupElement(batchComponentParams, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(stripExtraFieldsAndPageUrl(mockData))
        );
        expect(element.getWiredData()).toBeImmutable();
    });
});

describe('error cases', () => {
    it('adapter handles error responses.', async () => {
        const mockData = getMock('related-list-records-standard-error-Custom');
        const params = extractParamsFromMockData(mockData);
        params.relatedLists.push({
            relatedListId: 'missingRelatedList',
        });
        const resourceConfig = convertParamsToResourceParams(params);

        mockGetRelatedListRecordsBatchNetwork(resourceConfig, mockData);
        const element = await setupElement(params, RelatedListRecordsBatch);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
    });

    it("emits to component twice with error data - 400 status doesn't cache", async () => {
        const mockErrorData = getMock('related-list-records-standard-error-Custom');
        const mockFullData = getMock('related-list-records-standard-fields-Custom');
        const params = extractParamsFromMockData(mockFullData);
        const resourceConfig = convertParamsToResourceParams(params);
        mockGetRelatedListRecordsBatchNetwork(resourceConfig, [mockErrorData, mockFullData]);

        // Get data into the cache
        const errorElement = await setupElement(params, RelatedListRecordsBatch);
        expect(errorElement.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockErrorData)
        );
        expect(errorElement.getWiredData()).toBeImmutable();

        // Network is mocked only once, should still retrieve data here.
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockFullData)
        );
        expect(element.getWiredData()).toBeImmutable();
    });

    it('should retrieve actual data after error response cache expired', async () => {
        const mockError = getMock('related-list-records-standard-error-Custom');
        const mockData = getMock('related-list-records-standard-fields-Custom');
        const params = extractParamsFromMockData(mockData);
        const resourceConfig = convertParamsToResourceParams(params);
        mockGetRelatedListRecordsBatchNetwork(resourceConfig, [mockError, mockData]);

        // Get error data into the cache
        const errorElement = await setupElement(params, RelatedListRecordsBatch);
        expect(errorElement.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockError)
        );
        expect(errorElement.getWiredData()).toBeImmutable();

        // Cache bust
        expireRecords();

        // Should get the real data now
        const element = await setupElement(params, RelatedListRecordsBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFieldsAndPageUrl(mockData)
        );
        expect(element.getWiredData()).toBeImmutable();
    });
});
