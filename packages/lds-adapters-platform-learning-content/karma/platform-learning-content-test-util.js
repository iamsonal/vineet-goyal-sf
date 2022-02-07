// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/learning-content-platform/featured-item`;
const RELATED_LIST_PATH = `${URL_BASE}/list/related`;
const RECOMMENDED_LIST_PATH = `${URL_BASE}/list/recommended`;

export function clone(obj) {
    // this is needed from compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetRelatedListNetwork(config, mockData) {
    const paramMatch = getRelatedListMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetRelatedListNetworkErrorOnce(config, mockData) {
    const paramMatch = getRelatedListMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetRecommendedListNetwork(config, mockData) {
    const paramMatch = getRecommendedListMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetRecommendedListNetworkErrorOnce(config, mockData) {
    const paramMatch = getRecommendedListMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getRelatedListMatcher(config) {
    let { pageRef, appId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: RELATED_LIST_PATH,
        queryParams: { pageRef, appId },
    });
}

function getRecommendedListMatcher(config) {
    let { appId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: RECOMMENDED_LIST_PATH,
        queryParams: { appId },
    });
}
