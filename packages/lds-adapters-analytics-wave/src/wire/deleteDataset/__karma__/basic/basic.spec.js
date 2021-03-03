import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import { mockDeleteDatasetNetworkOnce, mockGetDatasetNetworkOnce } from 'analytics-wave-test-util';
import { deleteDataset } from 'lds-adapters-analytics-wave';
import { karmaNetworkAdapter } from 'lds-engine';
import GetDataset from '../../../getDataset/__karma__/lwc/get-dataset';

const MOCK_PREFIX = 'wire/deleteDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteDataset - basic', () => {
    it('sends request with the given dataset ID', async () => {
        const mock = getMock('dataset');
        const config = {
            datasetIdOrApiName: mock.id,
        };
        mockDeleteDatasetNetworkOnce(config);
        await deleteDataset(config);
        const expected = {
            basePath: `/wave/datasets/${mock.id}`,
            method: 'delete',
            urlParams: { datasetIdOrApiName: mock.id },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts dataset from cache', async () => {
        const mockDataset = getMock('dataset');
        const mockError = getMock('delete-dataset-not-exist');
        const config = {
            datasetIdOrApiName: mockDataset.id,
        };
        const elementConfig = {
            idOrApiName: mockDataset.id,
        };

        // First GET call should retrieve successfully. Second GET call should return not found.
        mockGetDatasetNetworkOnce(config, [
            mockDataset,
            {
                reject: true,
                status: 404,
                data: mockError,
            },
        ]);
        mockDeleteDatasetNetworkOnce(config);

        // First successful GET call will populate the cache
        const el = await setupElement(elementConfig, GetDataset);

        await deleteDataset(config);
        // The existing GET wire will be refreshed
        await flushPromises();

        expect(el.pushCount()).toBe(2);
        expect(el.getWiredError()).toEqual(mockError);
        expect(el.getWiredError()).toBeImmutable();
    });
});

describe('deleteDataset - errors', () => {
    it('rejects when server returns an error', async () => {
        const mockError = getMock('delete-dataset-error');
        const config = {
            datasetIdOrApiName: "05vRM00000003rZYAQ'",
        };

        mockDeleteDatasetNetworkOnce(config, { reject: true, data: mockError });

        let error;
        try {
            await deleteDataset(config);
            fail("deleteDataset should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorResponse(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mockDataset = getMock('dataset');
        const mockError = getMock('delete-dataset-error');
        const config = {
            datasetIdOrApiName: mockDataset.id,
        };
        const elementConfig = {
            idOrApiName: mockDataset.id,
        };

        mockGetDatasetNetworkOnce(config, mockDataset);
        mockDeleteDatasetNetworkOnce(config, { reject: true, data: mockError });

        // GET call will populate the cache
        await setupElement(elementConfig, GetDataset);
        try {
            await deleteDataset(config);
            fail('deleteDataset should have thrown an error');
        } catch (e) {
            // Delete Dataset fails
        }

        // Assert that the Dataset is still in the cache
        const element = await setupElement(elementConfig, GetDataset);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockDataset);
    });
});
