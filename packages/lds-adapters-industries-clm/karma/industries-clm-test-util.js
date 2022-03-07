import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetContractNetworkOnce(config, mockData) {
    const paramMatch = recalculateMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetContractNetworkErrorOnce(config, mockData) {
    const paramMatch = recalculateMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}
export function mockGetTemplatesNetworkOnce(config, mockData) {
    const paramMatch = templatesMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTemplatestNetworkErrorOnce(config, mockData) {
    const paramMatch = templatesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}
export function mockCheckInNetworkOnce(config, mockData) {
    const paramMatch = checkInMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockCheckIntNetworkErrorOnce(config, mockData) {
    const paramMatch = checkInMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}
export function mockUnlockNetworkOnce(config, mockData) {
    const paramMatch = unlockMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUnlockNetworkErrorOnce(config, mockData) {
    const paramMatch = unlockMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}
function recalculateMatcher(config) {
    let { contractId } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/clm/contract/${contractId}/contract-document-version`,
        method: 'get',
    });
}
function templatesMatcher() {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/clm/document-templates`,
        method: 'get',
    });
}
function checkInMatcher(config) {
    let { contractdocumentversionid } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/clm/contract-document-version/${contractdocumentversionid}/checkIn`,
        method: 'patch',
    });
}
function unlockMatcher(config) {
    let { contractdocumentversionid } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/clm//contract-document-version/${contractdocumentversionid}/unlock`,
        method: 'patch',
    });
}
