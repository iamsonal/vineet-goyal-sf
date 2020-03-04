import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/commerce`;

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
        path: `${URL_BASE}/webstores/${webstoreId}/search/product-search`,
        queryParams: {},
    });
}

export { mockPostProductSearchNetworkOnce, mockPostProductSearchNetworkErrorOnce };
