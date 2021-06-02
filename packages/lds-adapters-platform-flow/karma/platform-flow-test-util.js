import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;

export function mockStartFlowNetworkOnce(config, mockData) {
    const paramMatch = startFlowMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockStartFlowNetworkSequence(config, mockData) {
    const paramMatch = startFlowMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockStartFlowNetworkErrorOnce(config, mockData) {
    const paramMatch = startFlowMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockNavigateFlowNetworkOnce(config, mockData) {
    const paramMatch = navigateFlowMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockNavigateFlowNetworkSequence(config, mockData) {
    const paramMatch = navigateFlowMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockNavigateFlowNetworkErrorOnce(config, mockData) {
    const paramMatch = navigateFlowMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockResumeFlowNetworkOnce(config, mockData) {
    const paramMatch = resumeFlowMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockResumeFlowNetworkSequence(config, mockData) {
    const paramMatch = resumeFlowMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockResumeFlowNetworkErrorOnce(config, mockData) {
    const paramMatch = resumeFlowMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function startFlowMatcher(config) {
    let { flowDevName } = config;

    return sinon.match({
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/runtime/${flowDevName}/startFlow`,
        queryParams: {},
    });
}

function navigateFlowMatcher(config) {
    let { flowDevName, action } = config;

    return sinon.match({
        body: {
            action,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/runtime/${flowDevName}/navigateFlow`,
        queryParams: {},
    });
}

function resumeFlowMatcher(config) {
    let { flowDevName } = config;

    return sinon.match({
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/interaction/runtime/${flowDevName}/resumeFlow`,
        queryParams: {},
    });
}
