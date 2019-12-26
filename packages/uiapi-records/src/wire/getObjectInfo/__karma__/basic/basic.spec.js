import { getMock as globalGetMock, removeElement, setupElement } from 'test-util';
import { expireObjectInfo, mockGetObjectInfoNetwork } from 'uiapi-test-util';

import ObjectBasic from '../lwc/object-basic';

const MOCK_PREFIX = 'wire/getObjectInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getObjectInfo - basic', () => {
    [
        { name: 'string', value: 'Account' },
        { name: 'ObjectId', value: { objectApiName: 'Account' } },
    ].forEach(testConfig => {
        it(`gets data when objectApiName is ${testConfig.name}`, async () => {
            const mockData = getMock('object-Account');
            const resourceConfig = { objectApiName: mockData.apiName };
            mockGetObjectInfoNetwork(resourceConfig, mockData);

            const props = { objectApiName: testConfig.value };
            const element = await setupElement(props, ObjectBasic);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });
});

describe('getObjectInfo - caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('object-Account');
        const resourceConfig = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(resourceConfig, mockData);

        // populate cache
        const props = { objectApiName: 'Account' };
        await setupElement(props, ObjectBasic);

        // second component should have the cached data without hitting network
        const element = await setupElement(props, ObjectBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('object-Account');
        const updatedData = getMock('object-Account');
        Object.assign(updatedData, {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        const resourceConfig = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(resourceConfig, [mockData, updatedData]);

        // populate cache
        const props = { objectApiName: 'Account' };
        await setupElement(props, ObjectBasic);

        // expire cache
        expireObjectInfo();
        // second component should retrieve from network with updated data
        const element = await setupElement(props, ObjectBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(updatedData);
    });

    it('returns cached data when data from network has same integrity fields (eTag)', async () => {
        const mockData = getMock('object-Account');
        const mockDataCopy = getMock('object-Account');
        // modify a field from the data for testing purpose
        mockDataCopy.feedEnabled = !mockDataCopy.feedEnabled;

        const resourceConfig = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(resourceConfig, [mockData, mockDataCopy]);

        // populate cache
        const props = { objectApiName: 'Account' };
        await setupElement(props, ObjectBasic);

        // expire cache
        expireObjectInfo();
        // second component retrieves data from network
        const element = await setupElement(props, ObjectBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('getObjectInfo - component lifecycle', () => {
    it('unsubscribes from snapshot updates when disconnected', async () => {
        const mockData = getMock('object-Account');
        const updatedData = getMock('object-Account');
        updatedData.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        updatedData.searchable = false;
        const resourceConfig = { objectApiName: mockData.apiName };
        mockGetObjectInfoNetwork(resourceConfig, [mockData, updatedData]);

        const element1 = await setupElement(resourceConfig, ObjectBasic);
        const element2 = await setupElement(resourceConfig, ObjectBasic);
        removeElement(element1);

        expireObjectInfo();

        // trigger network xhr #2
        await setupElement(resourceConfig, ObjectBasic);

        expect(element1.pushCount()).toBe(1);
        expect(element2.pushCount()).toBe(2);
    });
});

describe('getObjectInfo - refresh', () => {
    it('refreshes object info', async () => {
        const mockData = getMock('object-Account');
        const refreshed = getMock('object-Account');
        refreshed.eTag = refreshed.eTag + '999';
        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [mockData, refreshed]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });

    it('refreshes @tracked object info', async () => {
        const mockData = getMock('object-Account');
        const refreshed = getMock('object-Account');
        refreshed.eTag = refreshed.eTag + '999';
        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [mockData, refreshed]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await element.refreshTracked();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});
