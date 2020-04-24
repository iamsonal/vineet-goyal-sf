import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const { parentObjectApiName, relatedListId } = config;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-info/${parentObjectApiName}/${relatedListId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentObjectApiName and relatedListId', async () => {
        const mockData = getMock('related-list-info-Custom');
        const config = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };
        mockNetwork(config, mockData);

        const element = await setupElement(config, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
