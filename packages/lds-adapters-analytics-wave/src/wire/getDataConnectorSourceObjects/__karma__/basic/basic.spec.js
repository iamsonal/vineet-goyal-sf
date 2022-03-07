import timekeeper from 'timekeeper';
import GetDataConnectorSourceObjects from '../lwc/get-data-connector-source-objects';
import GetDataConnectorSourceObject from '../../../getDataConnectorSourceObject/__karma__/lwc/get-data-connector-source-object';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    mockGetDataConnectorSourceObjectsNetworkOnce,
    mockGetDataConnectorSourceObjectsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnectorSourceObjects/__karma__/data/';
const connectorIdOrApiName = '0Itxx0000004C92CAE';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connector source objects', async () => {
        const mock = getMock('data-connector-source-objects');
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets data connector source objects with search', async () => {
        const mock = getMock('data-connector-source-objects-search');
        const config = { connectorIdOrApiName, q: 'ADMINCustomEntity__' };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets data connectors with params', async () => {
        const mock = getMock('data-connector-source-objects-with-params');
        const config = {
            connectorIdOrApiName,
            page: 'eyJwYWdlU2l6ZSI6NSwic29ydE9yZGVyIjoiTkFNRSIsImxhc3RJZCI6IjAwMDAwMDAwMDAwMDAwMCIsImxhc3ROYW1lIjoiQUlBcHBsaWNhdGlvbiJ9',
            pageSize: 5,
        };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('data-connector-source-objects');
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('fetch a second time after TTL expires', async () => {
        const mock = getMock('data-connector-source-objects');
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, [mock, mock]);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        timekeeper.travel(Date.now() + TTL + 1);

        await updateElement(el, config);
        expect(el.pushCount()).toBe(2);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch on individual source object if the collection has already been retrieved', async () => {
        const mock = getMock('data-connector-source-objects');
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const config2 = {
            connectorIdOrApiName: '0Itxx0000004C92CAE',
            sourceObjectName: 'AIApplication',
        };
        const el2 = await setupElement(config2, GetDataConnectorSourceObject);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData().name).toEqual(config2.sourceObjectName);
        expect(el2.getWiredData().dataConnector.id).toEqual(config2.connectorIdOrApiName);
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
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
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
        const config = { connectorIdOrApiName };
        mockGetDataConnectorSourceObjectsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceObjects);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
