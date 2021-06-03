import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence, clearCache } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const MANAGED_CONTENT_VARIANT_TTL = 3600000;

function mockCreateDeployment(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetManagedContentVariant(config, mockData) {
    const paramMatch = getManagedContentVariantMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function getCreateDeploymentsMatcher(config) {
    let {
        contentSpaceId,
        channelIds,
        description,
        contentIds,
        executeStagedDeployments,
        scheduledDate,
    } = config;
    return sinon.match({
        body: {
            contentSpaceId,
            channelIds,
            description,
            contentIds,
            executeStagedDeployments,
            scheduledDate,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/cms/deployments`,
        queryParams: {},
    });
}

function getManagedContentVariantMatcher(config) {
    let { variantId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/contents/variants/${variantId}`,
        queryParams: {},
    });
}

function mockCreateDeploymentsErrorOnce(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetManagedContentVariantErrorOnce(config, mockData) {
    const paramMatch = getManagedContentVariantMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function clearManagedContentVariantCache() {
    clearCache();
}

/**
 * Force a cache expiration for variant by fast-forwarding time past the
 * content variant TTL
 */
function expireManagedContentVariant() {
    timekeeper.travel(Date.now() + MANAGED_CONTENT_VARIANT_TTL + 1);
}

export {
    getCreateDeploymentsMatcher,
    mockCreateDeployment,
    mockCreateDeploymentsErrorOnce,
    mockGetManagedContentVariant,
    mockGetManagedContentVariantErrorOnce,
    expireManagedContentVariant,
    clearManagedContentVariantCache,
};
