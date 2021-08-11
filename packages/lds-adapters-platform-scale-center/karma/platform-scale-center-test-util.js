import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/scalecenter`;

function mockExecuteQueryNetworkOnce(requestParams, mockResponse) {
    const paramMatch = getExecuteQueryMatcher(requestParams);
    if (Array.isArray(mockResponse)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockResponse);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockResponse);
    }
}

function mockExecuteQueryNetworkErrorOnce(requestParams, mockResponse) {
    const paramMatch = getExecuteQueryMatcher(requestParams);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockResponse);
}

function getExecuteQueryMatcher(config) {
    let { request } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/metrics/query`,
        queryParams: {
            request,
        },
    });
}

export { URL_BASE, mockExecuteQueryNetworkOnce, mockExecuteQueryNetworkErrorOnce };
