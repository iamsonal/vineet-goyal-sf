import GetConnection from '../lwc/get-connection';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetConnectionNetworkOnce,
    mockGetConnectionNetworkErrorOnce,
    expireAsset,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getConnection/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connection', async () => {
        const mock = getMock('connection');
        const config = { id: mock.id };
        mockGetConnectionNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id }, GetConnection);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('connection');
        const config = { id: mock.id };
        mockGetConnectionNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id }, GetConnection);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ id: mock.id }, GetConnection);
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
        const id = 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4';
        const config = { id: id };
        mockGetConnectionNetworkErrorOnce(config, mock);

        const el = await setupElement({ id: id }, GetConnection);
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

        const id = 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4';
        const config = { id: id };

        mockGetConnectionNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement({ id: id }, GetConnection);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ id: id }, GetConnection);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('connection');
        const config = { id: mock.id };
        mockGetConnectionNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetConnection);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetConnection);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('connection');
        const updatedData = getMock('connection-2');
        const config = { id: mock.id };
        mockGetConnectionNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetConnection);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetConnection);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
