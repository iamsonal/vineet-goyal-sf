import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence, clearCache } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const CONTENT_LIST_TTL = 3600000;

function mockListContentInternal(config, mockData) {
    const paramMatch = getListContentInternalMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockListContentInternalErrorOnce(config, mockData) {
    const paramMatch = getListContentInternalMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getListContentInternalMatcher(config) {
    let { communityId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/communities/${communityId}/managed-content/delivery/contents`,
        queryParams: {},
    });
}

function mockListContent(config, mockData) {
    const paramMatch = getListContentMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockListContentErrorOnce(config, mockData) {
    const paramMatch = getListContentMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getListContentMatcher(config) {
    let { communityId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/communities/${communityId}/managed-content/delivery`,
        queryParams: {},
    });
}

function mockCollectionItemsForSiteMatcher(config, mockData) {
    const paramMatch = getCollectionItemsForSiteMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCollectionItemsForSiteMatcherErrorOnce(config, mockData) {
    const paramMatch = getCollectionItemsForSiteMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getCollectionItemsForSiteMatcher(config) {
    let { siteId, collectionKeyOrId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/sites/${siteId}/cms/delivery/collections/${collectionKeyOrId}`,
        queryParams: {},
    });
}

function mockCollectionsMetadataForSiteMatcher(config, mockData) {
    const paramMatch = getCollectionsMetadataForSiteMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCollectionsMetadataForSiteMatcherErrorOnce(config, mockData) {
    const paramMatch = getCollectionsMetadataForSiteMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getCollectionsMetadataForSiteMatcher(config) {
    let { siteId, collectionKeyOrId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/sites/${siteId}/cms/delivery/collections/${collectionKeyOrId}/metadata`,
        queryParams: {},
    });
}

function mockCollectionItemsForChannelMatcher(config, mockData) {
    const paramMatch = getCollectionItemsMatcherForChannel(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCollectionItemsForChannelMatcherErrorOnce(config, mockData) {
    const paramMatch = getCollectionItemsMatcherForChannel(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getCollectionItemsMatcherForChannel(config) {
    let { channelId, collectionKeyOrId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/delivery/channels/${channelId}/collections/${collectionKeyOrId}`,
        queryParams: {},
    });
}

function mockCollectionMetadtaForChannelMatcher(config, mockData) {
    const paramMatch = getCollectionMetadataMatcherForChannel(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCollectionMetadataForChannelMatcherErrorOnce(config, mockData) {
    const paramMatch = getCollectionMetadataMatcherForChannel(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getCollectionMetadataMatcherForChannel(config) {
    let { channelId, collectionKeyOrId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/delivery/channels/${channelId}/collections/${collectionKeyOrId}/metadata`,
        queryParams: {},
    });
}

function clearContentListCache() {
    clearCache();
}

/**
 * Force a cache expiration for contentList by fast-forwarding time past the
 * contentList TTL
 */
function expireContentList() {
    timekeeper.travel(Date.now() + CONTENT_LIST_TTL + 1);
}

export {
    mockListContentInternal,
    mockListContentInternalErrorOnce,
    mockListContent,
    mockListContentErrorOnce,
    mockCollectionItemsForSiteMatcher,
    mockCollectionItemsForSiteMatcherErrorOnce,
    mockCollectionsMetadataForSiteMatcher,
    mockCollectionsMetadataForSiteMatcherErrorOnce,
    mockCollectionItemsForChannelMatcher,
    mockCollectionItemsForChannelMatcherErrorOnce,
    mockCollectionMetadtaForChannelMatcher,
    mockCollectionMetadataForChannelMatcherErrorOnce,
    expireContentList,
    clearContentListCache,
};
