import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetObjectInfoNetwork } from 'uiapi-test-util';

import ObjectBasic from '../lwc/object-basic';

const MOCK_PREFIX = 'wire/getObjectInfo/__karma__/refresh/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('refresh', () => {
    it('should refresh object info', async () => {
        const mockData = getMock('object-Account');
        const resourceConfig = { objectApiName: mockData.apiName };
        mockGetObjectInfoNetwork(resourceConfig, [mockData, mockData]);

        const props = { objectApiName: mockData.apiName };
        const element = await setupElement(props, ObjectBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const refreshed = await element.refresh();
        expect(refreshed).toBeUndefined();

        // element should not have received new data
        expect(element.pushCount()).toBe(1);
    });

    it('should emit new snapshot when refresh returns changed data', async () => {
        const mockData = getMock('object-Account');
        const updated = getMock('object-Account');
        updated.eTag = 'changed';
        updated.searchable = false;
        const resourceConfig = { objectApiName: mockData.apiName };
        mockGetObjectInfoNetwork(resourceConfig, [mockData, updated]);

        const props = { objectApiName: mockData.apiName };
        const element = await setupElement(props, ObjectBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(updated);
    });
});
