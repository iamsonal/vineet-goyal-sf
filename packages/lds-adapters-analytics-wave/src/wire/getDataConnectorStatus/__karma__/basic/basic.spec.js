import timekeeper from 'timekeeper';
import GetDataConnectorStatus from '../lwc/get-data-connector-status';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    mockGetDataConnectorStatusNetworkOnce,
    mockGetDataConnectorStatusNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnectorStatus/__karma__/data/';
const config = { connectorIdOrApiName: '0ItS70000004CVSKA2' };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connector status', async () => {
        const mock = getMock('data-connector-status-success');
        mockGetDataConnectorStatusNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time before TTL', async () => {
        const mock = getMock('data-connector-status-success');
        mockGetDataConnectorStatusNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorStatus);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('fetch a second time after TTL', async () => {
        const mockSuccess = getMock('data-connector-status-success');
        const mockError = getMock('data-connector-status-error');
        mockGetDataConnectorStatusNetworkOnce(config, [mockSuccess, mockError]);

        let el = await setupElement(config, GetDataConnectorStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mockSuccess);

        await updateElement(el, { connectorIdOrApiName: null });

        timekeeper.travel(Date.now() + 1000 + 1);

        await updateElement(el, config);
        expect(el.pushCount()).toBe(2);
        expect(el.getWiredData()).toEqual(mockError);
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

        mockGetDataConnectorStatusNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorStatus);
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

        mockGetDataConnectorStatusNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetDataConnectorStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorStatus);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
