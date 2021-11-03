import timekeeper from 'timekeeper';
import GetDatabase from '../lwc/get-database';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDatabaseNetworkOnce,
    mockGetDatabaseNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getDatabase/__karma__/data/';

const TTL = 5000;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets database', async () => {
        const mock = getMock('database');
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatabase);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('database');
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatabase);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDatabase);
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
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDatabase);
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
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetDatabase);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDatabase);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('database');
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDatabase);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDatabase);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('database');
        const updatedData = getMock('database-updated');
        const config = { dbName: 'testDatabase01' };
        mockGetDatabaseNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDatabase);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDatabase);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
