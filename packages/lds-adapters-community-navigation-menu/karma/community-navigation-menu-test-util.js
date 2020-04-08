import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;

function mockGetNavItemsNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetNavItemsNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getMatcher(config) {
    let { communityId, navigationLinkSetDeveloperName, navigationLinkSetId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/communities/${communityId}/navigation-menu/navigation-menu-items`,
        queryParams: {
            navigationLinkSetId,
            navigationLinkSetDeveloperName,
        },
    });
}

export { mockGetNavItemsNetworkOnce, mockGetNavItemsNetworkErrorOnce };
