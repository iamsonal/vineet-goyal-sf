import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetObjectInfosNetwork, mockGetObjectInfoNetwork } from 'uiapi-test-util';

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
        const notFound = getMock('object-error');
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
            [
                {
                    reject: true,
                    status: 404,
                    statusText: 'Not Found',
                    ok: false,
                    data: notFound,
                },
            ]
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
                    statusCode: 200,
                    result: account,
                },
                {
                    statusCode: 404,
                    result: notFound,
                },
            ],
        });
    });
});
