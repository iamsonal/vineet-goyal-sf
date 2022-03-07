import GetDataset from '../lwc/get-dataset';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDatasetNetworkOnce,
    mockGetDatasetNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    ['dataset', 'dataset_with_xmd', 'dataset_staged'].forEach((filename) => {
        it(`gets ${filename} by id`, async () => {
            const mock = getMock(filename);
            mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.id }, mock);

            const el = await setupElement({ idOrApiName: mock.id }, GetDataset);
            expect(el.pushCount()).toBe(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('does not fetch a second time by id', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.id }, mock);

        const params = { idOrApiName: mock.id };
        const el = await setupElement(params, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(params, GetDataset);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('gets dataset by name', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.name }, mock);

        const el = await setupElement({ idOrApiName: mock.name }, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.name }, mock);

        const params = { idOrApiName: mock.name };
        const el = await setupElement(params, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(params, GetDataset);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name (case-insensitive)', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.name }, mock);

        const el = await setupElement({ idOrApiName: mock.name }, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ idOrApiName: mock.name.toUpperCase() }, GetDataset);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch by name after fetching by id', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.id }, mock);

        const el = await setupElement({ idOrApiName: mock.id }, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ idOrApiName: mock.name }, GetDataset);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);

        const el3 = await setupElement({ idOrApiName: mock.name.toUpperCase() }, GetDataset);
        expect(el3.pushCount()).toBe(1);
        expect(el3.getWiredData()).toEqual(mock);
    });

    it('does not fetch by id after fetching by name', async () => {
        const mock = getMock('dataset');
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: mock.name }, mock);

        const el = await setupElement({ idOrApiName: mock.name }, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ idOrApiName: mock.id }, GetDataset);
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
        mockGetDatasetNetworkErrorOnce({ datasetIdOrApiName: 'foo' }, mock);

        const el = await setupElement({ idOrApiName: 'foo' }, GetDataset);
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
        mockGetDatasetNetworkOnce({ datasetIdOrApiName: 'foo' }, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const params = { idOrApiName: 'foo' };
        const el = await setupElement(params, GetDataset);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(params, GetDataset);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataset');
        const config = { datasetIdOrApiName: mock.id };
        const setupConfig = { idOrApiName: mock.id };
        mockGetDatasetNetworkOnce(config, mock);

        // populate cache
        await setupElement(setupConfig, GetDataset);

        // second component should have the cached data without hitting network
        const element = await setupElement(setupConfig, GetDataset);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataset');
        const updatedData = getMock('dataset-2');
        const config = { datasetIdOrApiName: mock.id };
        const setupConfig = { idOrApiName: mock.id };
        mockGetDatasetNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(setupConfig, GetDataset);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(setupConfig, GetDataset);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
