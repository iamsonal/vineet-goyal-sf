import GetCatalogTable from '../../../getCatalogTable/__karma__/lwc/get-catalog-table';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    URL_CATALOG_BASE,
    mockGetCatalogTableNetworkOnce,
    mockDeleteCatalogTableNetworkOnce,
} from 'analytics-data-service-test-util';
import { deleteCatalogTable } from 'lds-adapters-analytics-data-service';
import { karmaNetworkAdapter } from 'lds-engine';

const MOCK_PREFIX = 'wire/deleteCatalogTable/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteCatalogTable - basic', () => {
    it('sends request with the given qualifiedName ', async () => {
        const mock = getMock('table');
        const config = {
            qualifiedName: mock.qualifiedName,
        };
        mockDeleteCatalogTableNetworkOnce(config);
        await deleteCatalogTable(config);
        const expected = {
            basePath: `${URL_CATALOG_BASE}/tables/${mock.qualifiedName}`,
            method: 'delete',
            urlParams: { qualifiedName: mock.qualifiedName },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts table from cache', async () => {
        const mock = getMock('table');
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: getMock('delete-table-not-exist'),
        };
        const config = {
            qualifiedName: mock.qualifiedName,
        };

        // First GET call should retrieve successfully. Second GET call should return not found.
        mockGetCatalogTableNetworkOnce(config, [
            mock,
            {
                reject: true,
                data: mockError,
            },
        ]);
        mockDeleteCatalogTableNetworkOnce(config);

        // First successful GET call will populate the cache
        const el = await setupElement(config, GetCatalogTable);

        await deleteCatalogTable(config);
        // The existing GET wire will be refreshed
        await flushPromises();

        expect(el.pushCount()).toBe(2);
        expect(el.getWiredError()).toEqual(mockError);
        expect(el.getWiredError()).toBeImmutable();
    });
});

describe('deleteCatalogTable - errors', () => {
    it('rejects when server returns an error', async () => {
        const mockError = getMock('delete-table-error');
        const config = {
            qualifiedName: 'A.B.C',
        };

        mockDeleteCatalogTableNetworkOnce(config, { reject: true, data: { body: mockError } });

        let error;
        try {
            await deleteCatalogTable(config);
            fail("deleteCatalogTable should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorBody(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mock = getMock('table');
        const mockError = getMock('delete-table-error');
        const config = {
            qualifiedName: mock.qualifiedName,
        };

        mockGetCatalogTableNetworkOnce(config, mock);
        mockDeleteCatalogTableNetworkOnce(config, { reject: true, data: mockError });

        // GET call will populate the cache
        await setupElement(config, GetCatalogTable);
        try {
            await deleteCatalogTable(config);
            fail('deleteCatalogTable should have thrown an error');
        } catch (e) {
            // Delete catalog table fails
        }

        // Assert that the recipe is still in the cache
        const element = await setupElement(config, GetCatalogTable);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
