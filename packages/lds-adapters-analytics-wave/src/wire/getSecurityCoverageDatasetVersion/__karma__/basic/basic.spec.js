import GetSecurityCoverageDatasetVersion from '../lwc/get-security-coverage-dataset-version';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetSecurityCoverageDatasetVersionNetworkOnce,
    mockGetSecurityCoverageDatasetVersionNetworkErrorOnce,
} from 'analytics-wave-test-util';
import timekeeper from 'timekeeper';

const MOCK_PREFIX = 'wire/getSecurityCoverageDatasetVersion/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets security coverage for dataset version', async () => {
        const mock = getMock('security-coverage-dataset-version');
        const config = {
            idOfDataset: mock.datasetVersion.dataset.id,
            versionId: mock.datasetVersion.id,
        };
        mockGetSecurityCoverageDatasetVersionNetworkOnce(config, mock);

        const el = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('security-coverage-dataset-version');
        const config = {
            idOfDataset: mock.datasetVersion.dataset.id,
            versionId: mock.datasetVersion.id,
        };
        mockGetSecurityCoverageDatasetVersionNetworkOnce(config, mock);

        const el = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const errorMock = getMock('error');
        const config = { idOfDataset: 'datasetIdOrApiName', versionId: 'versionId' };
        mockGetSecurityCoverageDatasetVersionNetworkErrorOnce(config, errorMock);

        const el = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(errorMock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const errorMock = getMock('error');
        const config = { idOfDataset: 'datasetIdOrApiName', versionId: 'versionId' };

        mockGetSecurityCoverageDatasetVersionNetworkOnce(config, {
            reject: true,
            data: errorMock,
        });

        const el = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el.getWiredError()).toEqual(errorMock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement(config, GetSecurityCoverageDatasetVersion);
        expect(el2.getWiredError()).toEqual(errorMock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('security-coverage-dataset-version');
        const config = {
            idOfDataset: mock.datasetVersion.dataset.id,
            versionId: mock.datasetVersion.id,
        };
        mockGetSecurityCoverageDatasetVersionNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetSecurityCoverageDatasetVersion);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetSecurityCoverageDatasetVersion);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('security-coverage-dataset-version');
        const updatedData = getMock('security-coverage-dataset-version-updated');
        const config = {
            idOfDataset: mock.datasetVersion.dataset.id,
            versionId: mock.datasetVersion.id,
        };
        mockGetSecurityCoverageDatasetVersionNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetSecurityCoverageDatasetVersion);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetSecurityCoverageDatasetVersion);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
