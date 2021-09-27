import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListCount from '../lwc/related-list-count';

const MOCK_PREFIX = 'wire/getRelatedListCount/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const parentRecordId = config.parentRecordId;
    const relatedListId = config.relatedListId;
    const queryParams = { ...config };
    delete queryParams.parentRecordId;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-count/${parentRecordId}/${relatedListId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListId', async () => {
        const mockData = getMock('related-list-count-Custom');
        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
        };
        const element = await setupElement(props, RelatedListCount);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
