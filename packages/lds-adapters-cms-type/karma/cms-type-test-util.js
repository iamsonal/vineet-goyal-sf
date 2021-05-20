// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence, clearCache } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const CONTENT_TYPE_TTL = 3600000;

function mockGetContentTypeInternal(config, mockData) {
    const paramMatch = getContentTypeInternalMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetContentTypeInternalErrorOnce(config, mockData) {
    const paramMatch = getContentTypeInternalMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getContentTypeInternalMatcher(config) {
    let { contentTypeIdOrFQN } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/types/${contentTypeIdOrFQN}`,
        queryParams: {},
    });
}

function clearContentTypeCache() {
    clearCache();
}

/**
 * Force a cache expiration for contentType by fast-forwarding time past the
 * contentList TTL
 */
function expireContentType() {
    timekeeper.travel(Date.now() + CONTENT_TYPE_TTL + 1);
}

export {
    mockGetContentTypeInternal,
    mockGetContentTypeInternalErrorOnce,
    expireContentType,
    clearContentTypeCache,
};
