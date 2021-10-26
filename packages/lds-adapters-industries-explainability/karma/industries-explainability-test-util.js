//
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const INTERACTION_TTL = 1000;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockExplainabilityActionLogsNetworkOnce(config, mockData) {
    const paramMatch = getExplainabilityActionLogsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockExplainabilityActionLogsNetworkErrorOnce(config, mockData) {
    const paramMatch = getExplainabilityActionLogsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockStoreExplainabilityActionLogNetworkOnce(config, mockData) {
    const paramMatch = storeExplainabilityActionLogMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockStoreExplainabilityActionLogNetworkErrorOnce(config, mockData) {
    const paramMatch = storeExplainabilityActionLogMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getExplainabilityActionLogsMatcher(config) {
    let { actionContextCode, applicationType, applicationSubType } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/explainability-service/action-logs`,
        queryParams: { actionContextCode, applicationType, applicationSubType },
    });
}

function storeExplainabilityActionLogMatcher(config) {
    let { explainabilityActionLogDefinition } = config;

    return sinon.match({
        body: {
            explainabilityActionLogDefinition,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/explainability-service/action-logs`,
        queryParams: {},
    });
}

/**
 * Force a cache expiration for searchData by fast-forwarding time past the
 * searchData TTL
 */
export function expireSearchData() {
    timekeeper.travel(Date.now() + INTERACTION_TTL + 1);
}
