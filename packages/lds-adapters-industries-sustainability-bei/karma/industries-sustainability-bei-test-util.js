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

export function mockBeiNetworkOnce(config, mockData) {
    const paramMatch = beiMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockBeiNetworkErrorOnce(config, mockData) {
    const paramMatch = beiMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function beiMatcher(config) {
    let { recordId } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/bei/recalculate/${recordId}`,
        method: 'post',
        urlParams: {
            recordId: recordId,
        },
    });
}
