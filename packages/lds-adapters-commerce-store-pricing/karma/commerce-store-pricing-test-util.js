import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/commerce`;

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
        path: `${URL_BASE}/webstores/${webstoreId}/pricing/products/${productId}`,
        queryParams: {
            effectiveAccountId,
        },
    });
}

export { mockGetProductPriceNetworkOnce, mockGetProductPriceNetworkErrorOnce };
