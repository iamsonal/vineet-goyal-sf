// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v54.0';
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
