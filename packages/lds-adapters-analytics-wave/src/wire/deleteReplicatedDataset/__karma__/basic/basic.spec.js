import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    URL_BASE,
    mockDeleteReplicatedDatasetNetworkOnce,
    mockGetReplicatedDatasetNetworkOnce,
} from 'analytics-wave-test-util';
import { deleteReplicatedDataset } from 'lds-adapters-analytics-wave';
import { karmaNetworkAdapter } from 'lds-engine';
import GetReplicatedDataset from '../../../getReplicatedDataset/__karma__/lwc/get-replicated-dataset';

const MOCK_PREFIX = 'wire/deleteReplicatedDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteReplicatedDataset - basic', () => {
    it('sends request with the given replicated dataset ID', async () => {
        const mock = getMock('replicated-dataset');
        const config = {
            id: mock.id,
        };
        mockDeleteReplicatedDatasetNetworkOnce(config);
        await deleteReplicatedDataset(config);
        const expected = {
            basePath: `${URL_BASE}/replicatedDatasets/${mock.id}`,
            method: 'delete',
            urlParams: { id: mock.id },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts replicated dataset from cache', async () => {
        const mockReplicatedDataset = getMock('replicated-dataset');
        const replicatedDatasetId = mockReplicatedDataset.id;
        const mockError = getMock('delete-replicated-dataset-not-exist');
        const config = {
            id: replicatedDatasetId,
        };

        // First GET call should retrieve successfully. Second GET call should return not found.
        mockGetReplicatedDatasetNetworkOnce(config, [
            mockReplicatedDataset,
            {
                reject: true,
                status: 404,
                data: mockError,
            },
        ]);
        mockDeleteReplicatedDatasetNetworkOnce(config);

        // First successful GET call will populate the cache
        const el = await setupElement({ replicatedDatasetId }, GetReplicatedDataset);

        await deleteReplicatedDataset(config);
        // The existing GET wire will be refreshed
        await flushPromises();

        expect(el.pushCount()).toBe(2);
        expect(el.getWiredError()).toEqual(mockError);
        expect(el.getWiredError()).toBeImmutable();
    });
});

describe('deleteReplicatedDataset - errors', () => {
    it('rejects when server returns an error', async () => {
        const mockError = getMock('delete-replicated-dataset-error');
        const config = {
            id: "0IuS70000004CqIKAU'",
        };

        mockDeleteReplicatedDatasetNetworkOnce(config, { reject: true, data: mockError });

        let error;
        try {
            await deleteReplicatedDataset(config);
            fail("deleteReplicatedDataset should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorResponse(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mockReplicatedDataset = getMock('replicated-dataset');
        const replicatedDatasetId = mockReplicatedDataset.id;
        const mockError = getMock('delete-replicated-dataset-error');
        const config = {
            id: mockReplicatedDataset.id,
        };

        mockGetReplicatedDatasetNetworkOnce(config, mockReplicatedDataset);
        mockDeleteReplicatedDatasetNetworkOnce(config, { reject: true, data: mockError });

        // GET call will populate the cache
        await setupElement({ replicatedDatasetId }, GetReplicatedDataset);
        try {
            await deleteReplicatedDataset(config);
            fail('deleteReplicatedDataset should have thrown an error');
        } catch (e) {
            // Delete replicated dataset fails
        }

        // Assert that the recipe is still in the cache
        const element = await setupElement({ replicatedDatasetId }, GetReplicatedDataset);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockReplicatedDataset);
    });
});
