import GetDataConnectors from '../lwc/get-data-connectors';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataConnectorsNetworkOnce,
    mockGetDataConnectorsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnectors/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data connectors', async () => {
        const mock = getMock('connectors');
        const config = {};
        mockGetDataConnectorsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectors);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets data connectors with type, category, and scope', async () => {
        const mock = getMock('connectors_type_category_scope');
        const config = { connectorType: 'AmazonS3', category: 'FileBased', scope: 'CreatedByMe' };
        mockGetDataConnectorsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectors);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('connectors');
        const config = {};
        mockGetDataConnectorsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectors);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectors);
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
        const config = {};
        mockGetDataConnectorsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataConnectors);
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
        const config = {};
        mockGetDataConnectorsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataConnectors);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectors);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
