// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const CONNECT_BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockSearchRecordsNetworkOnce(config, mockData) {
    const paramMatch = searchRecordsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSearchRecordsNetworkErrorOnce(config, mockData) {
    const paramMatch = searchRecordsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockBuildVerificationContextNetworkOnce(config, mockData) {
    const paramMatch = buildVerificationContextMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockBuildVerificationContextNetworkErrorOnce(config, mockData) {
    const paramMatch = buildVerificationContextMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockIdentityVerificationNetworkOnce(config, mockData) {
    const paramMatch = identityVerificationMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockIdentityVerificationNetworkErrorOnce(config, mockData) {
    const paramMatch = identityVerificationMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function buildVerificationContextMatcher(config) {
    let { buildVerificationContextData } = config;

    return sinon.match({
        body: {
            buildVerificationContextData,
        },
        headers: {},
        method: 'post',
        baseUri: CONNECT_BASE_URI,
        basePath: '/connect/identity-verification/build-context/SampleVerificationFlow',
        queryParams: {},
    });
}

function searchRecordsMatcher(config) {
    let { searchRecordsContextData } = config;

    return sinon.match({
        body: {
            searchRecordsContextData,
        },
        headers: {},
        method: 'post',
        baseUri: CONNECT_BASE_URI,
        basePath: '/connect/identity-verification/search',
        queryParams: {},
    });
}

function identityVerificationMatcher(config) {
    let { identityVerificationContextData } = config;

    return sinon.match({
        body: {
            identityVerificationContextData,
        },
        headers: {},
        method: 'post',
        baseUri: CONNECT_BASE_URI,
        basePath: '/connect/identity-verification/verification',
        queryParams: {},
    });
}
