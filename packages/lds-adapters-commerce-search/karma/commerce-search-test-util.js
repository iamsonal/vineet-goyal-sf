import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v50.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/commerce`;

function mockPostProductSearchNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockPostProductSearchNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getMatcher(config) {
    let { webstoreId, query } = config;
    return sinon.match({
        body: query,
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/webstores/${webstoreId}/search/product-search`,
        queryParams: {},
    });
}

export { mockPostProductSearchNetworkOnce, mockPostProductSearchNetworkErrorOnce };
