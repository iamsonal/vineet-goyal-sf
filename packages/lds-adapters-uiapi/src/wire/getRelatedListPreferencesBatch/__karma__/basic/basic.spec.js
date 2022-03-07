import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireRelatedListUserPreferences,
    mockGetRelatedListPreferencesNetwork,
    mockGetRelatedListPreferencesBatchNetwork,
} from 'uiapi-test-util';

import RelatedListPreferencesBatch from '../lwc/related-list-preferences-batch';
import RelatedListPreferencesSingle from '../../../getRelatedListPreferences/__karma__/lwc/related-list-preferences';

const MOCK_PREFIX = 'wire/getRelatedListPreferencesBatch/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid preferencesIds and no data cached', async () => {
        const mockData = getMock('related-list-preferences-batch-Random-Both');

        const preferencesIds = mockData.results.map((result) => result.result.preferencesId);
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, mockData);

        const props = {
            preferencesIds: preferencesIds,
        };
        const element = await setupElement(props, RelatedListPreferencesBatch);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-preferences-batch-Random-Both');

        const preferencesIds = mockData.results.map((result) => result.result.preferencesId);
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, mockData);

        const props = {
            preferencesIds: preferencesIds,
        };
        // populate cache
        await setupElement(props, RelatedListPreferencesBatch);
        // second component should have the cached data without hitting network
        const element = await setupElement(props, RelatedListPreferencesBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns updated result when cached data is expired', async () => {
        const mockData = getMock('related-list-preferences-batch-Random-Both');
        const updatedMockData = getMock('related-list-preferences-batch-Random-Both');

        updatedMockData.results[0].result.columnWidths.column1_random = 60;

        const preferencesIds = mockData.results.map((result) => result.result.preferencesId);
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, [mockData, updatedMockData]);

        const props = {
            preferencesIds: preferencesIds,
        };
        // populate cache
        await setupElement(props, RelatedListPreferencesBatch);

        expireRelatedListUserPreferences();
        // second component should have the updated data by hitting network
        const element = await setupElement(props, RelatedListPreferencesBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('returns cached result combined with network data in cache-miss scenario', async () => {
        const mockData1 = getMock('related-list-preferences-batch-Random01');
        const mockDataCombined = getMock('related-list-preferences-batch-Random-Both');

        const preferencesIds1 = mockData1.results.map((result) => result.result.preferencesId);
        const resourceConfig1 = {
            preferencesIds: preferencesIds1.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig1, mockData1);

        const props1 = {
            preferencesIds: preferencesIds1,
        };
        // first component should have the correct data from network.
        const element = await setupElement(props1, RelatedListPreferencesBatch);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData1);
        expect(element.getWiredData()).toBeImmutable();

        // Setup second element.
        const preferencesIds2 = mockDataCombined.results.map(
            (result) => result.result.preferencesId
        );
        const resourceConfigCombined = {
            preferencesIds: preferencesIds2.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfigCombined, mockDataCombined);
        const props2 = {
            preferencesIds: preferencesIds2,
        };
        // Second component should have the correct data from cache + network.
        const element2 = await setupElement(props2, RelatedListPreferencesBatch);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCombined);
        expect(element2.getWiredData()).toBeImmutable();
    });

    it('returns cached result when single wires match requested data', async () => {
        const mockData1 = getMock('related-list-preferences-batch-Random01');
        const mockData2 = getMock('related-list-preferences-batch-Random02');
        const mockDataCombined = getMock('related-list-preferences-batch-Random-Both');

        const preferencesId1 = mockData1.results[0].result.preferencesId;
        const preferencesId2 = mockData2.results[0].result.preferencesId;
        const resourceConfig1 = {
            preferencesId: preferencesId1,
        };
        const resourceConfig2 = {
            preferencesId: preferencesId2,
        };
        mockGetRelatedListPreferencesNetwork(resourceConfig1, mockData1.results[0].result);
        mockGetRelatedListPreferencesNetwork(resourceConfig2, mockData2.results[0].result);

        // Setup single components to propagate the cache
        await setupElement(resourceConfig1, RelatedListPreferencesSingle);
        await setupElement(resourceConfig2, RelatedListPreferencesSingle);

        // Setup batch element.
        const preferencesIdsCombined = mockDataCombined.results.map(
            (result) => result.result.preferencesId
        );
        const propsCombined = {
            preferencesIds: preferencesIdsCombined,
        };
        const batchElement = await setupElement(propsCombined, RelatedListPreferencesBatch);

        // Batch component should have the correct data from existing cache
        expect(batchElement.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCombined);
        expect(batchElement.getWiredData()).toBeImmutable();
    });

    it('validates 404 response from server', async () => {
        const mockError = getMock('related-list-preferences-batch-Missing');
        const preferencesIds = ['missingId'];
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, mockError);

        const props = {
            preferencesIds: preferencesIds,
        };
        const element = await setupElement(props, RelatedListPreferencesBatch);
        const error = element.getWiredData().results[0];
        expect(error.statusCode).toBe(404);
        expect(error).toEqualSnapshotWithoutEtags(mockError.results[0]);
    });

    it('validates 404 cache hit', async () => {
        const mockError = getMock('related-list-preferences-batch-Missing');
        const preferencesIds = ['missingId'];
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, mockError);

        const props = {
            preferencesIds: preferencesIds,
        };
        const element = await setupElement(props, RelatedListPreferencesBatch);
        const element2 = await setupElement(props, RelatedListPreferencesBatch);
        expect(element.pushCount()).toBe(1);
        expect(element2.pushCount()).toBe(1);
    });

    it('validates 404 cache miss', async () => {
        const mockError = getMock('related-list-preferences-batch-Missing');
        const preferencesIds = ['missingId'];
        const resourceConfig = {
            preferencesIds: preferencesIds.join(','),
        };
        const props = {
            preferencesIds: preferencesIds,
        };
        mockGetRelatedListPreferencesBatchNetwork(resourceConfig, [mockError, mockError]);

        const element = await setupElement(props, RelatedListPreferencesBatch);
        expireRelatedListUserPreferences();
        const element2 = await setupElement(props, RelatedListPreferencesBatch);

        const error1 = element.getWiredData().results[0];
        const error2 = element2.getWiredData().results[0];

        expect(error1).toEqualSnapshotWithoutEtags(mockError.results[0]);
        expect(error2).toEqualSnapshotWithoutEtags(mockError.results[0]);
    });
});
