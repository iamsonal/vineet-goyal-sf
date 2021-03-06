import GetDataConnectorSourceObject from '../lwc/get-data-connector-source-object';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataConnectorSourceObjectNetworkOnce,
    mockGetDataConnectorSourceObjectNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnectorSourceObject/__karma__/data/';
const config = {
    connectorIdOrApiName: '0ItS700000001YxKAI',
    sourceObjectName: 'AIApplication',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connector source object', async () => {
        const mock = getMock('data-connector-source-object');
        mockGetDataConnectorSourceObjectNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('data-connector-source-object');
        mockGetDataConnectorSourceObjectNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceObject);
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
        mockGetDataConnectorSourceObjectNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObject);
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
        mockGetDataConnectorSourceObjectNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataConnectorSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceObject);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
