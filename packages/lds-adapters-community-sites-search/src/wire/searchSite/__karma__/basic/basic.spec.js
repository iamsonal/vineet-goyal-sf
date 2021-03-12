import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockSiteSearchNetworkOnce,
    mockSiteSearchNetworkErrorOnce,
    expireSearchData,
} from '../../../../../karma/community-sites-search-test-util';
import SearchSite from '../lwc/search-site';

const MOCK_PREFIX = 'wire/searchSite/__karma__/data/';
const MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON = 'searchSiteWithSitePages';
const MOCK_SEARCH_SITE_WITH_HEADLESS_CONTENTS_JSON = 'searchSiteWithHeadlessContents';
const MOCK_SEARCH_SITE_WITH_MIXED_CONTENTS_JSON = 'searchSiteWithMixedContents';
const MOCK_SEARCH_SITE_EMPTY_JSON = 'searchSiteEmpty';

const MOCK_SITE_ID = '0DMR00000000wKcOAI'; //Some random siteId, not in mocked data.

const TEST_CONFIG = {
    siteId: MOCK_SITE_ID,
    queryParams: {
        queryTerm: 'energy',
        pageSize: 3,
        language: 'en_US',
    },
};
const WIRE_CONFIG = { siteId: MOCK_SITE_ID, ...TEST_CONFIG.queryParams };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches search result items successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.searchData).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        // Mock network request once only
        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.searchData).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el2.pushCount).toBe(1);
        expect(el2.searchData).toEqual(mock);
    });

    it('makes two network calls for two wire function invocations with different config', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        const pageToken = mock.nextPageToken;
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        const config2 = {
            siteId: siteId,
            queryParams: {
                queryTerm: 'energy',
                pageToken: pageToken,
                pageSize: 4,
                language: 'en_US',
            },
        };

        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        mockSiteSearchNetworkOnce(config2, mock);
        const wireConfig2 = { siteId: config2.siteId, ...config2.queryParams };

        const el1 = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el1.searchData).toEqual(mock);

        const el2 = await setupElement(wireConfig2, SearchSite);
        expect(el2.searchData).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount).toBe(1);
        expect(el2.pushCount).toBe(1);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        mockSiteSearchNetworkOnce(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(WIRE_CONFIG, SearchSite);

        expect(el1.pushCount).toBe(1);
        expect(el1.searchData).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(WIRE_CONFIG, SearchSite);

        // el2 should not have received new value
        expect(el2.pushCount).toBe(1);
        expect(el2.searchData).toEqualSnapshotWithoutEtags(mock);
    });

    it('displays error when network request returns 404s', async () => {
        const mockError = {
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

        mockSiteSearchNetworkErrorOnce(TEST_CONFIG, mockError);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.getError().body).toEqual(mockError);
    });

    it('causes a cache hit when a searchSite is queried after server returned 404', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockSiteSearchNetworkOnce(TEST_CONFIG, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        const elm = await setupElement(WIRE_CONFIG, SearchSite);
        expect(elm.getError()).toEqual(expectedError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(WIRE_CONFIG, SearchSite);
        expect(secondElm.getError()).toEqual(expectedError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a searchSite is queried again after server returned 404, and cache is cleared', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_SITE_PAGES_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockSiteSearchNetworkOnce(TEST_CONFIG, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            mock,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(WIRE_CONFIG, SearchSite);
        expect(elm.getError()).toEqual(expectedError);

        expireSearchData();

        const secondElm = await setupElement(WIRE_CONFIG, SearchSite);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.searchData).toEqual(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_EMPTY_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.searchData).toEqual(mock);
    });

    it('fetches search results successfully with heterogenous contents', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_MIXED_CONTENTS_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.searchData).toEqual(mock);
    });

    it('fetches search results successfully with headless contents only', async () => {
        const mock = getMock(MOCK_SEARCH_SITE_WITH_HEADLESS_CONTENTS_JSON);
        const siteId = mock.currentPageUrl.split('/')[6];
        TEST_CONFIG.siteId = siteId;
        WIRE_CONFIG.siteId = siteId;

        mockSiteSearchNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, SearchSite);
        expect(el.pushCount).toBe(1);
        expect(el.searchData).toEqual(mock);
    });
});
