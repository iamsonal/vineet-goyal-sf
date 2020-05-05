import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRelatedListInfoNetwork } from 'uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid parentObjectApiName and relatedListId', async () => {
        const mockData = getMock('related-list-info-Custom');
        const config = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };
        mockGetRelatedListInfoNetwork(config, mockData);

        const element = await setupElement(config, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
