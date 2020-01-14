import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListInfos from '../lwc/related-list-infos';

const MOCK_PREFIX = 'wire/getRelatedListInfos/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const parentObjectApiName = config.parentObjectApiName;
    const recordTypeId = config.recordTypeId;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.recordTypeId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-info/${parentObjectApiName}/${recordTypeId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentObjectApiName and recordTypeId', async () => {
        const mockData = getMock('related-list-infos-Custom');
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

        expect(element.getWiredData()).toEqual(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
