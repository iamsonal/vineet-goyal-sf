import { karmaNetworkAdapter } from 'lds';
import { mockNetworkOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/connect/cms/delivery`;

function mockGetDeliveryChannelsNetwork(config, mockData) {
    let { page, pageSize } = config;

    const paramMatch = sinon.match({
        body: null,
        headers: {},
        method: 'get',
        path: `${URL_BASE}/channels`,
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
        path: `${URL_BASE}/channels/${channelId}/contents/query`,
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
