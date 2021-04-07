import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const SEO_PROPERTIES_TTL = 3600000;

function mockGetSeoPropertiesOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetSeoPropertiesSequence(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetSeoPropertiesNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getMatcher(config) {
    let { communityId, recordId, fields } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/communities/${communityId}/seo/properties/${recordId}`,
        queryParams: {
            fields,
        },
    });
}

/**
 * Force a cache expiration for SEO properties by fast-forwarding time past the TTL
 */
function expireSeoProperties() {
    timekeeper.travel(Date.now() + SEO_PROPERTIES_TTL + 1);
}

export {
    mockGetSeoPropertiesOnce,
    mockGetSeoPropertiesNetworkErrorOnce,
    expireSeoProperties,
    mockGetSeoPropertiesSequence,
};
