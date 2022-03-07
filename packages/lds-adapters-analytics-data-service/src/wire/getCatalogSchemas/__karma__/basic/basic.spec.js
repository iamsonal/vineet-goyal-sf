import timekeeper from 'timekeeper';
import GetCatalogSchemas from '../lwc/get-catalog-schemas';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetCatalogSchemasNetworkOnce,
    mockGetCatalogSchemasNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getCatalogSchemas/__karma__/data/';

const TTL = 5000;
const config = {};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets schemas', async () => {
        const mock = getMock('schemas');
        mockGetCatalogSchemasNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogSchemas);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('schemas');
        mockGetCatalogSchemasNetworkOnce(config, mock);

        const el = await setupElement(config, GetCatalogSchemas);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogSchemas);
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
        mockGetCatalogSchemasNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetCatalogSchemas);
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
        mockGetCatalogSchemasNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetCatalogSchemas);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetCatalogSchemas);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('schemas');
        mockGetCatalogSchemasNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetCatalogSchemas);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetCatalogSchemas);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('schemas');
        const updatedData = getMock('schemas-updated');
        mockGetCatalogSchemasNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetCatalogSchemas);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetCatalogSchemas);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
