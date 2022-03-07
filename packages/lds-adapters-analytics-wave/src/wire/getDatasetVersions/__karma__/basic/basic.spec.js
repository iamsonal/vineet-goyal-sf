import timekeeper from 'timekeeper';
import GetDatasetVersions from '../lwc/get-dataset-versions';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDatasetVersionsNetworkOnce,
    mockGetDatasetVersionsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDatasetVersions/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataset versions', async () => {
        const mock = getMock('dataset-versions');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataset-versions');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDatasetVersions);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = getMock('error');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDatasetVersions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = getMock('error');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDatasetVersions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDatasetVersions);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataset-versions');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDatasetVersions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDatasetVersions);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataset-versions');
        const updatedData = getMock('dataset-versions-updated');
        const config = {
            idOfDataset: '0FbS700000047MtKAI',
        };
        mockGetDatasetVersionsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDatasetVersions);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDatasetVersions);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
