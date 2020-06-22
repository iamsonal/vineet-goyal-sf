import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v50.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect/cms/delivery`;

function mockGetDeliveryChannelsNetwork(config, mockData) {
    let { page, pageSize } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/channels`,
        queryParams: {
            page,
            pageSize,
        },
    });

    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockListContentNetwork(config, mockData) {
    let {
        channelId,
        endDate,
        includeMetadata,
        language,
        managedContentIds,
        managedContentType,
        page,
        pageSize,
        startDate,
    } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/channels/${channelId}/contents/query`,
        queryParams: {
            endDate,
            includeMetadata,
            language,
            managedContentIds,
            managedContentType,
            page,
            pageSize,
            startDate,
        },
    });

    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export { mockGetDeliveryChannelsNetwork, mockListContentNetwork };
