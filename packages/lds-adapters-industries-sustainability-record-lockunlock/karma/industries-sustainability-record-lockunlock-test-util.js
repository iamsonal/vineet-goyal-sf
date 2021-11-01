import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockLockRecordNetworkOnce(config, mockData) {
    const paramMatch = lockRecordMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockLockRecordNetworkErrorOnce(config, mockData) {
    const paramMatch = lockRecordMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function lockRecordMatcher(config) {
    let { recordId } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/record-locking/lock/${recordId}`,
        method: 'put',
        urlParams: {
            recordId: recordId,
        },
    });
}

export function mockUnlockRecordNetworkOnce(config, mockData) {
    const paramMatch = unlockRecordMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUnlockRecordNetworkErrorOnce(config, mockData) {
    const paramMatch = unlockRecordMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function unlockRecordMatcher(config) {
    let { recordId } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/record-locking/unlock/${recordId}`,
        method: 'put',
        urlParams: {
            recordId: recordId,
        },
    });
}
