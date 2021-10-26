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

export function mockUploadReferenceDataNetworkOnce(config, mockData) {
    const paramMatch = uploadReferenceDataMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUploadReferenceDataNetworkErrorOnce(config, mockData) {
    const paramMatch = uploadReferenceDataMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function uploadReferenceDataMatcher(config) {
    let { category, recordTypeId } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/reference-data/${category}/upload`,
        method: 'post',
        urlParams: {
            category: category,
        },
        queryParams: {
            recordTypeId: recordTypeId,
        },
    });
}
