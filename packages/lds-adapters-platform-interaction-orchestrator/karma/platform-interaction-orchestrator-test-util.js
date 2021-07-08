import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const INTERACTION_ORCHESTRATION_TTL = 30000;

export function mockGetOrchestrationInstanceCollectionNetworkOnce(config, mockData) {
    const paramMatch = getOrchestrationInstanceCollectionMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetOrchestrationInstanceCollectionNetworkErrorOnce(config, mockData) {
    const paramMatch = getOrchestrationInstanceCollectionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetOrchestrationInstanceCollectionNetworkSequence(config, mockData) {
    const paramMatch = getOrchestrationInstanceCollectionMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

/**
 * Force a cache expiration for interaction orchestration data by fast-forwarding time past the
 * orchestration TTL
 */
export function expireInteractionOrchestratorCaches() {
    timekeeper.travel(Date.now() + INTERACTION_ORCHESTRATION_TTL + 1);
}

function getOrchestrationInstanceCollectionMatcher(config) {
    let { relatedRecordId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/orchestration/instances`,
        queryParams: { relatedRecordId },
    });
}
