import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { mockNetworkErrorOnce, mockNetworkOnce, mockNetworkSequence } from 'test-util';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/smartdatadiscovery`;

// Recipes
function mockGetStoriesNetworkOnce(config, mockData) {
    const paramMatch = getStoriesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetStoriesNetworkErrorOnce(config, mockData) {
    const paramMatch = getStoriesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getStoriesMatcher(config) {
    const { folderId, inputId, page, pageSize, q, scope, sourceType, sourceTypes } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/stories`,
        queryParams: {
            folderId,
            inputId,
            page,
            pageSize,
            q,
            scope,
            sourceType,
            sourceTypes,
        },
    });
}
export { URL_BASE, mockGetStoriesNetworkOnce, mockGetStoriesNetworkErrorOnce };
