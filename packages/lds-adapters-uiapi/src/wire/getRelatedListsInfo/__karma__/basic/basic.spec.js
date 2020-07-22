import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListInfos from '../lwc/related-lists-info';

const MOCK_PREFIX = 'wire/getRelatedListsInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const parentObjectApiName = config.parentObjectApiName;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-info/${parentObjectApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentObjectApiName and recordTypeId', async () => {
        const mockData = getMock('related-lists-info-Custom');
        const resourceConfig = {
            parentObjectApiName: mockData.parentObjectApiName,
            recordTypeId: mockData.parentRecordTypeId,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentObjectApiName: mockData.parentObjectApiName,
            recordTypeId: mockData.parentRecordTypeId,
        };
        const element = await setupElement(props, RelatedListInfos);

        delete mockData.eTag; // W-7853002 - awkward scenario. We want the collection to be treated as opaque but we havent removed etags on the objects yet.
        expect(element.getWiredData()).toEqual(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
