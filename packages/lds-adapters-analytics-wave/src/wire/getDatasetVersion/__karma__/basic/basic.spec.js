import GetDatasetVersion from '../lwc/get-dataset-version';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDatasetVersionNetworkOnce,
    mockGetDatasetVersionNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDatasetVersion/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataset version', async () => {
        const mock = getMock('dataset-version');
        const config = { idOfDataset: mock.dataset.id, versionId: mock.id };
        mockGetDatasetVersionNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersion);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataset-version');
        const config = { idOfDataset: mock.dataset.id, versionId: mock.id };
        mockGetDatasetVersionNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersion);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDatasetVersion);
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
        const config = { idOfDataset: 'datasetIdOrApiName', versionId: 'versionId' };
        mockGetDatasetVersionNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersion);
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
        const config = { idOfDataset: 'datasetIdOrApiName', versionId: 'versionId' };

        mockGetDatasetVersionNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetDatasetVersion);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement(config, GetDatasetVersion);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataset-version');
        const config = { idOfDataset: mock.dataset.id, versionId: mock.id };
        mockGetDatasetVersionNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDatasetVersion);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDatasetVersion);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataset-version');
        const updatedData = getMock('dataset-version-updated');
        const config = { idOfDataset: mock.dataset.id, versionId: mock.id };
        mockGetDatasetVersionNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDatasetVersion);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDatasetVersion);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
