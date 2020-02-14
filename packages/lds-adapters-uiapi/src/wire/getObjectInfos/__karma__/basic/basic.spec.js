import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetObjectInfosNetwork } from 'uiapi-test-util';

import ObjectInfos from '../lwc/object-infos';

const MOCK_PREFIX = 'wire/getObjectInfos/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getObjectInfos', () => {
    it('returns data', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ObjectInfos);

        const actual = element.getWiredData();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, mockData);

        // populate cache
        await setupElement(resourceConfig, ObjectInfos);

        // second component should have the cached data without hitting network
        const element = await setupElement(resourceConfig, ObjectInfos);

        const actual = element.getWiredData();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });
});
