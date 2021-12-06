// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';
const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = '/connect/communities';

export function mockIngestRecordNetworkOnce(config, mockResponse) {
    const paramMatch = ingestRecordMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockResponse);
}

export function mockIngestRecordInvalidCommunityIdNetworkErrorOnce(config, mockResponse) {
    const paramMatch = ingestRecordMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockResponse);
}

function ingestRecordMatcher(config) {
    const { communityId /*groupBy, keyPrefix, processType, requestBody*/ } = config;

    let req = {
        body: {
            requestIngestionInput: {}, // Possible framework limitation on enumerating attributes on generic objects, so this is always an empty object
        },
        urlParams: {
            communityId: communityId,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${communityId}/microbatching`,
        queryParams: {},
    };

    return sinon.match(req);
}
