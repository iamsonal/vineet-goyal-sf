import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListsCount from '../lwc/related-lists-count';

const MOCK_PREFIX = 'wire/getRelatedListsCount/__karma__/basic/data/';
const MOCK_PARENT_RECORDID = 'a00RM0000004aVwYAI';
const MOCK_RELATED_LIST_NAMES = 'CwcCustom01s__r';

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
        path: `${URL_BASE}/related-list-count/batch/${parentRecordId}/${relatedListNames}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListNames', async () => {
        const mockData = getMock('related-lists-count-Custom');
        const resourceConfig = {
            parentRecordId: MOCK_PARENT_RECORDID,
            relatedListNames: MOCK_RELATED_LIST_NAMES,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: MOCK_PARENT_RECORDID,
            relatedListNames: MOCK_RELATED_LIST_NAMES,
        };
        const element = await setupElement(props, RelatedListsCount);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
