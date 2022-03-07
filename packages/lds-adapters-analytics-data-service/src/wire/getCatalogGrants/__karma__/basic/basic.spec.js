import timekeeper from 'timekeeper';
import GetCatalogGrants from '../lwc/get-catalog-grants';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetCatalogGrantsNetworkOnce,
    mockGetCatalogGrantsNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getCatalogGrants/__karma__/data/';

const TTL = 5000;
const config = { qualifiedName: 'testdb01.testSchema01.Account' };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets catalog grants', async () => {
        const mock = getMock('grants');
        mockGetCatalogGrantsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogGrants);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('grants');
        mockGetCatalogGrantsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogGrants);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogGrants);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockGetCatalogGrantsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetCatalogGrants);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockGetCatalogGrantsNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetCatalogGrants);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogGrants);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('grants');
        mockGetCatalogGrantsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetCatalogGrants);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetCatalogGrants);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('grants');
        const updatedData = getMock('grants-updated');
        mockGetCatalogGrantsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetCatalogGrants);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetCatalogGrants);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
