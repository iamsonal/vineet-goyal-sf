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

export function mockGetOrchestrationInstanceNetworkOnce(config, mockData) {
    const paramMatch = getOrchestrationInstanceMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetOrchestrationInstanceNetworkErrorOnce(config, mockData) {
    const paramMatch = getOrchestrationInstanceMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetOrchestrationInstanceNetworkSequence(config, mockData) {
    const paramMatch = getOrchestrationInstanceMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPublishOrchestrationEventNetworkOnce(config, mockData) {
    const paramMatch = publishOrchestrationEventMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPublishOrchestrationEventNetworkErrorOnce(config, mockData) {
    const paramMatch = publishOrchestrationEventMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

/**
 * Force a cache expiration for interaction orchestration data by fast-forwarding time past the
 * orchestration TTL
 */
export function expireInteractionOrchestratorCaches() {
    timekeeper.travel(Date.now() + INTERACTION_ORCHESTRATION_TTL + 1);
}

function getOrchestrationInstanceMatcher(config) {
    let { instanceId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/orchestration/instances/${instanceId}`,
        queryParams: {},
    });
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

function publishOrchestrationEventMatcher(config) {
    let { doesCancelOrchestrationInstance, orchestrationInstanceId, eventPayload, stepInstanceId } =
        config;

    return sinon.match({
        body: {
            doesCancelOrchestrationInstance,
            orchestrationInstanceId,
            eventPayload,
            stepInstanceId,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/orchestration/events`,
        queryParams: {},
    });
}
