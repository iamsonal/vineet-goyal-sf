import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/connect`;

function mockGetNavItemsNetwork(config, mockData) {
    let { communityId } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/communities/${communityId}/navigation-menu/navigation-menu-items`,
        queryParams: {
            addHomeMenuItem: undefined,
            includeImageUrl: undefined,
            menuItemTypesToSkip: undefined,
            navigationLinkSetId: undefined,
            publishStatus: undefined,
        },
    });

    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export { mockGetNavItemsNetwork };
