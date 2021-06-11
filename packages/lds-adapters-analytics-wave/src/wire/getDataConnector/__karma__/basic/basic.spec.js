import GetDataConnector from '../lwc/get-data-connector';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataConnectorNetworkOnce,
    mockGetDataConnectorNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnector/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connector', async () => {
        const mock = getMock('data-connector');
        const config = { connectorIdOrApiName: mock.id };
        mockGetDataConnectorNetworkOnce(config, mock);

        const el = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('data-connector');
        const config = { connectorIdOrApiName: mock.id };
        mockGetDataConnectorNetworkOnce(config, mock);

        const el = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0ItS700000001YxKAI',
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
        const config = { connectorIdOrApiName: mock.id };
        mockGetDataConnectorNetworkErrorOnce(config, mock);

        const el = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            id: '0ItS700000001YxKAI',
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
        const config = { connectorIdOrApiName: mock.id };

        mockGetDataConnectorNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ connectorIdOrApiName: mock.id }, GetDataConnector);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('data-connector');
        const config = { connectorIdOrApiName: mock.id };
        mockGetDataConnectorNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDataConnector);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDataConnector);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('data-connector');
        const updatedData = getMock('data-connector-2');
        const config = { connectorIdOrApiName: mock.id };
        mockGetDataConnectorNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDataConnector);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDataConnector);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
