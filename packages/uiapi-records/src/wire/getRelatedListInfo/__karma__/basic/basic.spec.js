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
    const { parentObjectApiName, recordTypeId, relatedListId } = config;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.recordTypeId;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-info/${parentObjectApiName}/${recordTypeId}/${relatedListId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    // TODO: update mock data to be compatible with v49
    xit('gets data with valid parentObjectApiName and relatedListId', async () => {
        const mockData = getMock('related-list-info-Custom');
        const resourceConfig = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
