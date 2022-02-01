import timekeeper from 'timekeeper';
import GetDependencies from '../lwc/get-dependencies';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDependenciesNetworkOnce,
    mockGetDependenciesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDependencies/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dependencies', async () => {
        const mock = getMock('dependencies');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };
        mockGetDependenciesNetworkOnce(config, mock);

        const el = await setupElement(config, GetDependencies);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dependencies');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };
        mockGetDependenciesNetworkOnce(config, mock);

        const el = await setupElement(config, GetDependencies);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDependencies);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mockError = getMock('error');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };

        // mock server to return 404
        mockGetDependenciesNetworkErrorOnce(config, mockError);

        const el = await setupElement(config, GetDependencies);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mockError);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mockError = getMock('error');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };

        // mock server to return 404
        mockGetDependenciesNetworkErrorOnce(config, mockError);

        const el = await setupElement(config, GetDependencies);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mockError);

        const el2 = await setupElement(config, GetDependencies);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mockError);
    });

    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dependencies');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };
        mockGetDependenciesNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDependencies);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDependencies);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dependencies');
        const updatedData = getMock('dependencies2');
        const config = {
            assetId: '0FbS700000047MtKAI',
        };
        // mock server to return 404
        mockGetDependenciesNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDependencies);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDependencies);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
