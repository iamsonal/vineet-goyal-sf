import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetObjectInfosNetwork,
    mockGetObjectInfoNetwork,
    expireObjectInfo,
} from 'uiapi-test-util';

import ObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';
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

    it('returns data in the order provided', async () => {
        const mockData = getMock('object-Opportunity-Account');
        const resourceConfig = { objectApiNames: ['Opportunity', 'Account'] };
        mockGetObjectInfosNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ObjectInfos);

        const actual = element.getWiredData();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('returns data, a mix of 404s and 200s, in the order provided', async () => {
        const mockData = getMock('object-Account-Opportunity-BadOpportunity');
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity', 'BadOpportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ObjectInfos);

        const actual = element.getWiredData();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('returns 200, even with all resources returned having 404', async () => {
        const mockData = getMock('object-BadAccount-BadOpportunity');
        const resourceConfig = { objectApiNames: ['BadAccount', 'BadOpportunity'] };
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

    it('should return in order requested when retrieved from the cache', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };

        const reversedOrderMockData = getMock('object-Opportunity-Account');
        const reversedOrderResourceConfig = { objectApiNames: ['Opportunity', 'Account'] };

        mockGetObjectInfosNetwork(resourceConfig, mockData);

        // populate cache
        await setupElement(resourceConfig, ObjectInfos);

        // second component requests the same resources, but in reversed order
        const reversedBatch = await setupElement(reversedOrderResourceConfig, ObjectInfos);

        expect(reversedBatch.getWiredData()).toEqualSnapshotWithoutEtags(reversedOrderMockData);
    });

    it('should be a cache hit when Account and Opportunity object infos are loaded separately', async () => {
        const opportunity = getMock('object-Opportunity');
        const account = getMock('object-Account');
        const mockBatch = getMock('object-Account-Opportunity');

        mockGetObjectInfoNetwork(
            {
                objectApiName: 'Account',
            },
            account
        );

        mockGetObjectInfoNetwork(
            {
                objectApiName: 'Opportunity',
            },
            opportunity
        );

        await setupElement(
            {
                objectApiName: 'Account',
            },
            ObjectInfo
        );

        await setupElement(
            {
                objectApiName: 'Opportunity',
            },
            ObjectInfo
        );

        const batch = await setupElement(
            {
                objectApiNames: ['Account', 'Opportunity'],
            },
            ObjectInfos
        );

        expect(batch.getWiredData()).toEqualSnapshotWithoutEtags(mockBatch);
    });

    it('should be a cache hit when single object info previously returned a mix of 404s and 200s', async () => {
        const notFoundError = getMock('object-error');
        const errorResponse = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: notFoundError,
        };
        const account = getMock('object-Account');

        mockGetObjectInfoNetwork(
            {
                objectApiName: 'Account',
            },
            account
        );

        mockGetObjectInfoNetwork(
            {
                objectApiName: 'notfound',
            },
            {
                reject: true,
                data: errorResponse,
            }
        );

        await setupElement(
            {
                objectApiName: 'Account',
            },
            ObjectInfo
        );

        await setupElement(
            {
                objectApiName: 'notfound',
            },
            ObjectInfo
        );

        const batch = await setupElement(
            {
                objectApiNames: ['notfound', 'Account'],
            },
            ObjectInfos
        );

        const wiredData = batch.getWiredData();
        expect(wiredData).toEqualSnapshotWithoutEtags({
            results: [
                {
                    statusCode: 404,
                    result: notFoundError,
                },
                {
                    statusCode: 200,
                    result: account,
                },
            ],
        });
    });

    it('returns data from network when the cache is expired', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const updatedData = getMock('object-Account-Opportunity');
        Object.assign(updatedData.results[0].result, {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
            defaultRecordTypeId: '012000000000000BBB',
        });
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, [mockData, updatedData]);

        // Populate cache
        const comp = await setupElement(resourceConfig, ObjectInfos);
        expect(comp.pushCount()).toBe(1);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        // Expire cache
        expireObjectInfo();
        // trigger network request
        await setupElement(resourceConfig, ObjectInfos);
        expect(comp.pushCount()).toBe(2);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(updatedData);
    });

    it('should refresh data', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const refreshData = getMock('object-Account-Opportunity');
        refreshData.results[0].result.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, [mockData, refreshData]);

        const comp = await setupElement(resourceConfig, ObjectInfos);
        expect(comp.pushCount()).toBe(1);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await comp.refresh();

        expect(comp.pushCount()).toBe(2);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(refreshData);
    });

    it('should refresh data more than once', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const refreshData = getMock('object-Account-Opportunity');
        refreshData.results[0].result.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        const secondRefreshData = getMock('object-Account-Opportunity');
        secondRefreshData.results[0].result.eTag = 'secondRefresh';

        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, [mockData, refreshData, secondRefreshData]);

        const comp = await setupElement(resourceConfig, ObjectInfos);
        expect(comp.pushCount()).toBe(1);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await comp.refresh();

        expect(comp.pushCount()).toBe(2);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(refreshData);

        await comp.refresh();

        expect(comp.pushCount()).toBe(3);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(secondRefreshData);
    });

    it('should refresh @tracked object infos', async () => {
        const mockData = getMock('object-Account-Opportunity');
        const refreshData = getMock('object-Account-Opportunity');
        refreshData.results[0].result.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        const resourceConfig = { objectApiNames: ['Account', 'Opportunity'] };
        mockGetObjectInfosNetwork(resourceConfig, [mockData, refreshData]);

        const comp = await setupElement(resourceConfig, ObjectInfos);
        expect(comp.pushCount()).toBe(1);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await comp.refreshTracked();

        expect(comp.pushCount()).toBe(2);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(refreshData);
    });
});
