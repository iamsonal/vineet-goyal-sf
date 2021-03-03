import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v52.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const SEARCH_DATA_TTL = 3600000;

function mockSiteSearchNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockSiteSearchNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

/**
 * Force a cache expiration for searchData by fast-forwarding time past the
 * searchData TTL
 */
function expireSearchData() {
    timekeeper.travel(Date.now() + SEARCH_DATA_TTL + 1);
}

function getMatcher(config) {
    let { siteId, queryParams } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/sites/${siteId}/search`,
        queryParams: queryParams,
    });
}

export { mockSiteSearchNetworkOnce, mockSiteSearchNetworkErrorOnce, expireSearchData };
