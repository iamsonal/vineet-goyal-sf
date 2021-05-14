import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListsCount from '../lwc/related-lists-count';

const MOCK_PREFIX = 'wire/getRelatedListsCount/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const parentRecordId = config.parentRecordId;
    const relatedListNames = config.relatedListNames;
    const queryParams = { ...config };
    delete queryParams.parentRecordId;
    delete queryParams.relatedListNames;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-count/batch/${parentRecordId}/${relatedListNames}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListNames', async () => {
        const mockData = getMock('related-lists-count-Custom');

        const parentRecordId = mockData.results[0].result.listReference.inContextOfRecordId;
        const relatedListNames = mockData.results.map(
            (result) => result.result.listReference.relatedListId
        );
        const resourceConfig = {
            parentRecordId: parentRecordId,
            relatedListNames: relatedListNames.join(','),
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: parentRecordId,
            relatedListNames: relatedListNames,
        };
        const element = await setupElement(props, RelatedListsCount);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });

    it('gets no data from network with valid parentRecordId and empty relatedListNames', async () => {
        const mockData = getMock('related-lists-count-Custom');
        const parentRecordId = mockData.results[0].result.listReference.inContextOfRecordId;

        const props = {
            parentRecordId: parentRecordId,
            relatedListNames: [],
        };
        const element = await setupElement(props, RelatedListsCount);

        expect(element.getWiredData()).toEqual(undefined);
    });

    it('parses error message with valid parentRecordId and invalid relatedListNames', async () => {
        const mockData = getMock('related-lists-count-errorCase');

        const parentRecordId = 'a00RM0000004aVwYAI';
        const relatedListNames = ['relatedListThatDoesntExist'];
        const resourceConfig = {
            parentRecordId: parentRecordId,
            relatedListNames: relatedListNames.join(','),
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: parentRecordId,
            relatedListNames: relatedListNames,
        };
        const element = await setupElement(props, RelatedListsCount);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
