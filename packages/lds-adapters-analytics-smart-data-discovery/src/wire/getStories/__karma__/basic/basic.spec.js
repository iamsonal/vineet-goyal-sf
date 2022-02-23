import timekeeper from 'timekeeper';
import GetStories from '../lwc/get-stories';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetStoriesNetworkOnce,
    mockGetStoriesNetworkErrorOnce,
} from 'analytics-smart-data-discovery-test-util';

const MOCK_PREFIX = 'wire/getStories/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets stories', async () => {
        const mock = getMock('stories');
        const config = {};
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories by folderId', async () => {
        const mock = getMock('stories-by-folder-id');
        const config = { folderId: '00lRM000000nOziYAE' };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories by inputId', async () => {
        const mock = getMock('stories-by-input-id');
        const config = { inputId: '0FbRM0000002szC0AQ' };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories with query', async () => {
        const mock = getMock('stories-by-query');
        const config = { q: 'OpportunitiesRegion' };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories by pageSize', async () => {
        const mock = getMock('stories-by-page-size');
        const config = { pageSize: 2 };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories by sourceType', async () => {
        const mock = getMock('stories-by-source-type');
        const config = { sourceType: 'Report' };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets stories by sourceTypes', async () => {
        const mock = getMock('stories-by-source-types');
        const config = { sourceTypes: ['AnalyticsDataset', 'Report'] };
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('stories');
        const config = {};
        mockGetStoriesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetStories);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = getMock('error');
        const config = {};
        mockGetStoriesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = getMock('error');
        const config = {};
        mockGetStoriesNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetStories);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetStories);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('stories');
        const config = {};
        mockGetStoriesNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetStories);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetStories);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('stories');
        const updatedData = getMock('stories-by-folder-id');
        const config = {};
        mockGetStoriesNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetStories);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetStories);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
