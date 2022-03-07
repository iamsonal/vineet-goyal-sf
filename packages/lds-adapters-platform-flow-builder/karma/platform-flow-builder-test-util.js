import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const FLOW_BUILDER_TTL = 60000;

export function mockGetRulesNetworkOnce(config, mockData) {
    const paramMatch = getRulesMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetRulesNetworkErrorOnce(config, mockData) {
    const paramMatch = getRulesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetRulesNetworkSequence(config, mockData) {
    const paramMatch = getRulesMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

/**
 * Force a cache expiration for flow builder data by fast-forwarding time past the
 * flow builder TTL
 */
export function expireFlowBuilderCaches() {
    timekeeper.travel(Date.now() + FLOW_BUILDER_TTL + 1);
}

function getRulesMatcher(config) {
    let { flowTriggerType, recordTriggerType } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/builder/rules`,
        queryParams: { flowTriggerType, recordTriggerType },
    });
}
