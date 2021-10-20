import GetConnector from '../lwc/get-connector';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetConnectorNetworkOnce,
    mockGetConnectorNetworkErrorOnce,
    expireAsset,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getConnector/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connector', async () => {
        const mock = getMock('connector');
        const config = { id: mock.id };
        mockGetConnectorNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id }, GetConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('connector');
        const config = { id: mock.id };
        mockGetConnectorNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id }, GetConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ id: mock.id }, GetConnector);
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
        const id = 'SALESFORCE_ADS';
        const config = { id: id };
        mockGetConnectorNetworkErrorOnce(config, mock);

        const el = await setupElement({ id: id }, GetConnector);
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

        const id = 'SALESFORCE_ADS';
        const config = { id: id };

        mockGetConnectorNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement({ id: id }, GetConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ id: id }, GetConnector);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('connector');
        const config = { id: mock.id };
        mockGetConnectorNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetConnector);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetConnector);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('connector');
        const updatedData = getMock('connector-2');
        const config = { id: mock.id };
        mockGetConnectorNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetConnector);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetConnector);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
