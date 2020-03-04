import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/connect`;

function mockGetNavItemsNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetNavItemsNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getMatcher(config) {
    let { communityId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/communities/${communityId}/navigation-menu/navigation-menu-items`,
        queryParams: {},
    });
}

export { mockGetNavItemsNetworkOnce, mockGetNavItemsNetworkErrorOnce };
