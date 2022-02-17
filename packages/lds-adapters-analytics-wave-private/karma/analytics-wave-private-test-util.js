import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';
import timekeeper from 'timekeeper';

import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/wave`;
const ASSET_TTL = 5000;

// Execute SOQL Query
function mockExecuteSoqlQueryPostNetworkOnce(config, mockData) {
    const paramMatch = getExecuteSoqlQueryPostMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockExecuteSoqlQueryPostNetworkErrorOnce(config, mockData) {
    const paramMatch = getExecuteSoqlQueryPostMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getExecuteSoqlQueryPostMatcher(config) {
    let { query } = config;

    return sinon.match({
        body: { query },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/soql`,
    });
}

/**
 * Force a cache expiration for baseWaveAsset types by fast-forwarding time past the
 * standard TTL.
 */
function expireAsset() {
    timekeeper.travel(Date.now() + ASSET_TTL + 1);
}

export {
    URL_BASE,
    mockExecuteSoqlQueryPostNetworkOnce,
    mockExecuteSoqlQueryPostNetworkErrorOnce,
    expireAsset,
};
