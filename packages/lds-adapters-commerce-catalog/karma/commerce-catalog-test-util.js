import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/commerce`;

function mockGetProductNetworkOnce(config, mockData) {
    let { webstoreId, productId } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/webstores/${webstoreId}/products/${productId}`,
        queryParams: {},
    });

    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetProductNetworkErrorOnce(config, mock) {
    let { webstoreId, productId } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/webstores/${webstoreId}/products/${productId}`,
        queryParams: {},
    });

    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mock);
}

function mockGetProductCategoryPathNetworkOnce(config, mockData) {
    let { webstoreId, productCategoryId } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/webstores/${webstoreId}/product-category-path/product-categories/${productCategoryId}`,
        queryParams: {},
    });

    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetProductCategoryPathNetworkErrorOnce(config, mock) {
    let { webstoreId, productCategoryId } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/webstores/${webstoreId}/product-category-path/product-categories/${productCategoryId}`,
        queryParams: {},
    });

    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mock);
}

export {
    mockGetProductNetworkOnce,
    mockGetProductNetworkErrorOnce,
    mockGetProductCategoryPathNetworkOnce,
    mockGetProductCategoryPathNetworkErrorOnce,
};
