import timekeeper from 'timekeeper';
import GetCatalogDatabases from '../lwc/get-catalog-databases';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetCatalogDatabasesNetworkOnce,
    mockGetCatalogDatabasesNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getCatalogDatabases/__karma__/data/';
const config = {};
const TTL = 5000;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets databases', async () => {
        const mock = getMock('databases');

        mockGetCatalogDatabasesNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogDatabases);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('databases');
        mockGetCatalogDatabasesNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogDatabases);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogDatabases);
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
        mockGetCatalogDatabasesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetCatalogDatabases);
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
        mockGetCatalogDatabasesNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetCatalogDatabases);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogDatabases);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('databases');
        mockGetCatalogDatabasesNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetCatalogDatabases);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetCatalogDatabases);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('databases');
        const updatedData = getMock('databases-updated');
        mockGetCatalogDatabasesNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetCatalogDatabases);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetCatalogDatabases);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
