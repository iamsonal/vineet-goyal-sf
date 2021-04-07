import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence, clearCache } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v53.0';
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
    expireContentList,
    clearContentListCache,
};
