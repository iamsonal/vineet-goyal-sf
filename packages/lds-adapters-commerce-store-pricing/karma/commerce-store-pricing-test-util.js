import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v50.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/commerce`;

function mockGetProductPriceNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetProductPriceNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getMatcher(config) {
    let { webstoreId, productId, effectiveAccountId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/webstores/${webstoreId}/pricing/products/${productId}`,
        queryParams: {
            effectiveAccountId,
        },
    });
}

export { mockGetProductPriceNetworkOnce, mockGetProductPriceNetworkErrorOnce };
