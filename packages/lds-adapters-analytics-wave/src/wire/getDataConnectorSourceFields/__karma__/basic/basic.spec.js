import GetDataConnectorSourceFields from '../lwc/get-data-connector-source-fields';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataConnectorSourceFieldsNetworkOnce,
    mockGetDataConnectorSourceFieldsNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataConnectorSourceFields/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets source fields', async () => {
        const mock = getMock('fields');
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };
        mockGetDataConnectorSourceFieldsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('returns accessible=false and access denied properties', async () => {
        const mock = getMock('fields-no-access');
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Lead',
        };
        mockGetDataConnectorSourceFieldsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('fields');
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };
        mockGetDataConnectorSourceFieldsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceFields);
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
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };

        mockGetDataConnectorSourceFieldsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataConnectorSourceFields);
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
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };

        mockGetDataConnectorSourceFieldsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataConnectorSourceFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataConnectorSourceFields);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('fields');
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };
        mockGetDataConnectorSourceFieldsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDataConnectorSourceFields);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDataConnectorSourceFields);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('fields');
        const updatedData = getMock('fields-2');
        const config = {
            connectorIdOrApiName: '0ItRM00000001gF0AQ',
            sourceObjectName: 'Account',
        };
        mockGetDataConnectorSourceFieldsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDataConnectorSourceFields);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDataConnectorSourceFields);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
