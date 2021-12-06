import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence, clearCache } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const MANAGED_CONTENT_TTL = 100;
const MANAGED_CONTENT_VARIANT_TTL = 3600000;
const GET_MANAGED_CONTENT_BY_FOLDER_ID_TTL = 100;

function mockCreateDeployment(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetManagedContent(config, mockData) {
    const paramMatch = getManagedContentMatcher(config);
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

function mockGetManagedContentByFolderId(config, mockData) {
    const paramMatch = getManagedContentByFolderIdMatcher(config);
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

function getManagedContentMatcher(config) {
    let { contentKeyOrId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/contents/${contentKeyOrId}`,
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

function getManagedContentByFolderIdMatcher(config) {
    let { folderId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/folders/${folderId}/items`,
        queryParams: {},
    });
}

function mockCreateDeploymentsErrorOnce(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetManagedContentErrorOnce(config, mockData) {
    const paramMatch = getManagedContentMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetManagedContentVariantErrorOnce(config, mockData) {
    const paramMatch = getManagedContentVariantMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetManagedContentByFolderIdErrorOnce(config, mockData) {
    const paramMatch = getManagedContentByFolderIdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function clearManagedContentVariantCache() {
    clearCache();
}

function expireManagedContent() {
    timekeeper.travel(Date.now() + MANAGED_CONTENT_TTL + 1);
}

/**
 * Force a cache expiration for variant by fast-forwarding time past the
 * content variant TTL
 */
function expireManagedContentVariant() {
    timekeeper.travel(Date.now() + MANAGED_CONTENT_VARIANT_TTL + 1);
}

/**
 * Force a cache expiration for managed content fetch by ID call, by fast-forwarding time past the TTL
 */
function expireGetManagedContentByFolderId() {
    timekeeper.travel(Date.now() + GET_MANAGED_CONTENT_BY_FOLDER_ID_TTL + 1);
}

function getCreateManagedContentsMatcher(config) {
    var contentSpaceOrFolderId = config.contentSpaceOrFolderId,
        contentType = config.contentType,
        title = config.title,
        urlName = config.urlName,
        contentBody = config.contentBody;
    return sinon.match({
        body: {
            contentSpaceOrFolderId: contentSpaceOrFolderId,
            contentType: contentType,
            title: title,
            urlName: urlName,
            contentBody: contentBody,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/contents`,
        queryParams: {},
    });
}

function mockCreateManagedContent(config, mockData) {
    var paramMatch = getCreateManagedContentsMatcher(config);

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCreateManagedContentErrorOnce(config, mockData) {
    var paramMatch = getCreateManagedContentsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}
function getReplaceManagedContentsVaraiantsMatcher(config) {
    var variantId = config.variantId,
        title = config.title,
        urlName = config.urlName,
        contentBody = config.contentBody;
    return sinon.match({
        body: {
            title: title,
            urlName: urlName,
            contentBody: contentBody,
        },
        headers: {},
        method: 'put',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/cms/contents/variants/${variantId}`,
        queryParams: {},
    });
}

function mockReplaceManagedContentVariant(config, mockData) {
    var paramMatch = getReplaceManagedContentsVaraiantsMatcher(config);

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockReplaceManagedContentVariantErrorOnce(config, mockData) {
    var paramMatch = getReplaceManagedContentsVaraiantsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export {
    getCreateDeploymentsMatcher,
    mockCreateDeployment,
    mockCreateDeploymentsErrorOnce,
    mockGetManagedContent,
    mockGetManagedContentErrorOnce,
    expireManagedContent,
    mockGetManagedContentVariant,
    mockGetManagedContentVariantErrorOnce,
    expireManagedContentVariant,
    mockGetManagedContentByFolderId,
    mockGetManagedContentByFolderIdErrorOnce,
    expireGetManagedContentByFolderId,
    clearManagedContentVariantCache,
    getCreateManagedContentsMatcher,
    mockCreateManagedContent,
    mockCreateManagedContentErrorOnce,
    getReplaceManagedContentsVaraiantsMatcher,
    mockReplaceManagedContentVariant,
    mockReplaceManagedContentVariantErrorOnce,
};
