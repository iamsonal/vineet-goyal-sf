import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    URL_BASE,
    mockDeleteDataConnectorNetworkOnce,
    mockGetDataConnectorNetworkOnce,
} from 'analytics-wave-test-util';
import { deleteDataConnector } from 'lds-adapters-analytics-wave';
import { karmaNetworkAdapter } from 'lds-engine';
import GetDataConnector from '../../../getDataConnector/__karma__/lwc/get-data-connector';

const MOCK_PREFIX = 'wire/deleteDataConnector/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteDataConnector - basic', () => {
    it('sends request with the given data connector ID', async () => {
        const mock = getMock('data-connector');
        const config = {
            connectorIdOrApiName: mock.id,
        };
        mockDeleteDataConnectorNetworkOnce(config);
        await deleteDataConnector(config);
        const expected = {
            basePath: `${URL_BASE}/dataConnectors/${mock.id}`,
            method: 'delete',
            urlParams: { connectorIdOrApiName: mock.id },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts data connector from cache', async () => {
        const mockDataConnector = getMock('data-connector');
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: getMock('delete-data-connector-not-exist'),
        };
        const config = {
            connectorIdOrApiName: mockDataConnector.id,
        };

        // First GET call should retrieve successfully. Second GET call should return not found.
        mockGetDataConnectorNetworkOnce(config, [
            mockDataConnector,
            {
                reject: true,
                data: mockError,
            },
        ]);
        mockDeleteDataConnectorNetworkOnce(config);

        // First successful GET call will populate the cache
        const el = await setupElement(config, GetDataConnector);

        await deleteDataConnector(config);
        // The existing GET wire will be refreshed
        await flushPromises();

        expect(el.pushCount()).toBe(2);
        expect(el.getWiredError()).toEqual(mockError);
        expect(el.getWiredError()).toBeImmutable();
    });
});

describe('deleteDataConnector - errors', () => {
    it('rejects when server returns an error', async () => {
        const mockError = getMock('delete-data-connector-error');
        const config = {
            connectorIdOrApiName: '0ItS700000001YxKAI',
        };

        mockDeleteDataConnectorNetworkOnce(config, { reject: true, data: { body: mockError } });

        let error;
        try {
            await deleteDataConnector(config);
            fail("deleteDataConnector should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorBody(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mockDataConnector = getMock('data-connector');
        const mockError = getMock('delete-data-connector-error');
        const config = {
            connectorIdOrApiName: mockDataConnector.id,
        };

        mockGetDataConnectorNetworkOnce(config, mockDataConnector);
        mockDeleteDataConnectorNetworkOnce(config, { reject: true, data: mockError });

        // GET call will populate the cache
        await setupElement(config, GetDataConnector);
        try {
            await deleteDataConnector(config);
            fail('deleteDataConnector should have thrown an error');
        } catch (e) {
            // Delete data connector fails
        }

        // Assert that the data connector is still in the cache
        const element = await setupElement(config, GetDataConnector);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockDataConnector);
    });
});
