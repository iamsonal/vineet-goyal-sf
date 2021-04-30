import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/wave`;

// Execute Query
function mockExecuteQueryNetworkOnce(config, mockData) {
    const paramMatch = getExecuteQueryMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockExecuteQueryNetworkErrorOnce(config, mockData) {
    const paramMatch = getExecuteQueryMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getExecuteQueryMatcher(config) {
    let { query } = config;

    return sinon.match({
        body: { query },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/query`,
    });
}

// Analytics Limits
function mockGetAnalyticsLimitsNetworkOnce(config, mockData) {
    const paramMatch = getAnalyticsLimitsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetAnalyticsLimitsNetworkErrorOnce(config, mockData) {
    const paramMatch = getAnalyticsLimitsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getAnalyticsLimitsMatcher(config) {
    let { types, licenseType } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/limits`,
        queryParams: {
            types,
            licenseType,
        },
    });
}

// Data connector types
function mockGetDataConnectorTypesNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorTypesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorTypesNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorTypesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorTypesMatcher(_config) {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectorTypes`,
        queryParams: {},
    });
}

// Dataflow Jobs
function mockGetDataflowJobsNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataflowJobsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowJobsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobsMatcher(config) {
    let { licenseType, page, pageSize, q, status } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs`,
        queryParams: {
            licenseType,
            page,
            pageSize,
            q,
            status,
        },
    });
}

function mockCreateDataflowJobNetworkOnce(config, mockData) {
    const paramMatch = createDataflowJobMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockCreateDataflowJobNetworkErrorOnce(config, mockData) {
    const paramMatch = createDataflowJobMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function createDataflowJobMatcher(config) {
    let { command, dataflowId } = config;

    return sinon.match({
        body: { command, dataflowId },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs`,
        queryParams: {},
    });
}

// Dataflow Job
function mockGetDataflowJobNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataflowJobNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowJobMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobMatcher(config) {
    let { dataflowjobId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs/${dataflowjobId}`,
        queryParams: {},
    });
}

function mockUpdateDataflowJobNetworkOnce(config, mockData) {
    const paramMatch = updateDataflowJobMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateDataflowJobNetworkErrorOnce(config, mockData) {
    const paramMatch = updateDataflowJobMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateDataflowJobMatcher(config) {
    let { dataflowjobId, command } = config;

    return sinon.match({
        body: { command },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs/${dataflowjobId}`,
        queryParams: {},
    });
}

// Dataflow Job Nodes
function mockGetDataflowJobNodesNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobNodesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataflowJobNodesNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowJobNodesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobNodesMatcher(config) {
    let { dataflowjobId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs/${dataflowjobId}/nodes`,
        queryParams: {},
    });
}

// Dataflow Job Node
function mockGetDataflowJobNodeNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobNodeMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataflowJobNodeNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowJobNodeMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobNodeMatcher(config) {
    let { dataflowjobId, nodeId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs/${dataflowjobId}/nodes/${nodeId}`,
        queryParams: {},
    });
}

// Dataset
function mockGetDatasetNetworkOnce(config, mockData) {
    const paramMatch = getDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDatasetNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDatasetMatcher(config) {
    let { datasetIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${datasetIdOrApiName}`,
        queryParams: {},
    });
}

function mockDeleteDatasetNetworkOnce(config, mockData = {}) {
    const paramMatch = deleteDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteDatasetNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = deleteDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function deleteDatasetMatcher(config) {
    let { datasetIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${datasetIdOrApiName}`,
    });
}

// Datasets
function mockGetDatasetsNetworkOnce(config, mockData) {
    const paramMatch = getDatasetsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDatasetsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatasetsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDatasetsMatcher(config) {
    let { datasetTypes, folderId, licenseType, page, pageSize, q, scope } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        basePath: `${URL_BASE}/datasets`,
        queryParams: {
            datasetTypes,
            folderId,
            licenseType,
            page,
            pageSize,
            q,
            scope,
        },
    });
}

// Recipes
function mockGetRecipesNetworkOnce(config, mockData) {
    const paramMatch = getRecipesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecipesNetworkErrorOnce(config, mockData) {
    const paramMatch = getRecipesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getRecipesMatcher(config) {
    let { format, licenseType, page, pageSize, q, sort } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes`,
        queryParams: {
            format,
            licenseType,
            page,
            pageSize,
            q,
            sort,
        },
    });
}

// Recipe
function mockGetRecipeNetworkOnce(config, mockData) {
    const paramMatch = getRecipeMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecipeNetworkErrorOnce(config, mockData) {
    const paramMatch = getRecipeMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getRecipeMatcher(config) {
    const { id, format } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes/${id}`,
        queryParams: {
            format,
        },
    });
}

function mockDeleteRecipeNetworkOnce(config, mockData = {}) {
    const paramMatch = deleteRecipeMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteRecipeNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = deleteRecipeMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function deleteRecipeMatcher(config) {
    let { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes/${id}`,
    });
}

// Replicated Datasets
function mockGetReplicatedDatasetsNetworkOnce(config, mockData) {
    const paramMatch = getReplicatedDatasetsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetReplicatedDatasetsNetworkErrorOnce(config, mockData) {
    const paramMatch = getReplicatedDatasetsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getReplicatedDatasetsMatcher(config) {
    let { category, connector, sourceObject } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets`,
        queryParams: {
            category,
            connector,
            sourceObject,
        },
    });
}

// Schedule
function mockGetScheduleNetworkOnce(config, mockData) {
    const paramMatch = getScheduleMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetScheduleNetworkErrorOnce(config, mockData) {
    const paramMatch = getScheduleMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getScheduleMatcher(config) {
    const { assetId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/asset/${assetId}/schedule`,
        queryParams: {},
    });
}

function mockUpdateScheduleNetworkOnce(config, mockData) {
    const paramMatch = updateScheduleMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateScheduleNetworkErrorOnce(config, mockData) {
    const paramMatch = updateScheduleMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateScheduleMatcher(config) {
    let { assetId, schedule } = config;

    return sinon.match({
        body: { schedule },
        headers: {},
        method: 'put',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/asset/${assetId}/schedule`,
        queryParams: {},
    });
}

// WaveFolders
function mockGetWaveFoldersNetworkOnce(config, mockData) {
    const paramMatch = getWaveFoldersMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetWaveFoldersNetworkErrorOnce(config, mockData) {
    const paramMatch = getWaveFoldersMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getWaveFoldersMatcher(config) {
    let {
        templateSourceId,
        page,
        pageSize,
        q,
        sort,
        isPinned,
        scope,
        mobileOnlyFeaturedAssets,
    } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/folders`,
        queryParams: {
            templateSourceId,
            page,
            pageSize,
            q,
            sort,
            isPinned,
            scope,
            mobileOnlyFeaturedAssets,
        },
    });
}

// XMD
function mockGetXmdNetworkOnce(config, mockData) {
    const paramMatch = getXmdMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetXmdNetworkErrorOnce(config, mockData) {
    const paramMatch = getXmdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getXmdMatcher(config) {
    let { datasetIdOrApiName, versionId, xmdType } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${datasetIdOrApiName}/versions/${versionId}/xmds/${xmdType}`,
        queryParams: {},
    });
}

export {
    URL_BASE,
    mockExecuteQueryNetworkOnce,
    mockExecuteQueryNetworkErrorOnce,
    mockGetAnalyticsLimitsNetworkOnce,
    mockGetAnalyticsLimitsNetworkErrorOnce,
    mockGetDataConnectorTypesNetworkOnce,
    mockGetDataConnectorTypesNetworkErrorOnce,
    mockGetDataflowJobsNetworkOnce,
    mockGetDataflowJobsNetworkErrorOnce,
    mockCreateDataflowJobNetworkOnce,
    mockCreateDataflowJobNetworkErrorOnce,
    mockGetDataflowJobNetworkOnce,
    mockGetDataflowJobNetworkErrorOnce,
    mockUpdateDataflowJobNetworkOnce,
    mockUpdateDataflowJobNetworkErrorOnce,
    mockGetDataflowJobNodesNetworkOnce,
    mockGetDataflowJobNodesNetworkErrorOnce,
    mockGetDataflowJobNodeNetworkOnce,
    mockGetDataflowJobNodeNetworkErrorOnce,
    mockGetDatasetNetworkOnce,
    mockGetDatasetNetworkErrorOnce,
    mockDeleteDatasetNetworkOnce,
    mockDeleteDatasetNetworkErrorOnce,
    mockGetDatasetsNetworkOnce,
    mockGetDatasetsNetworkErrorOnce,
    mockGetRecipesNetworkOnce,
    mockGetRecipesNetworkErrorOnce,
    mockGetRecipeNetworkOnce,
    mockGetRecipeNetworkErrorOnce,
    mockDeleteRecipeNetworkOnce,
    mockDeleteRecipeNetworkErrorOnce,
    mockGetReplicatedDatasetsNetworkOnce,
    mockGetReplicatedDatasetsNetworkErrorOnce,
    mockGetScheduleNetworkOnce,
    mockGetScheduleNetworkErrorOnce,
    mockUpdateScheduleNetworkOnce,
    mockUpdateScheduleNetworkErrorOnce,
    mockGetWaveFoldersNetworkOnce,
    mockGetWaveFoldersNetworkErrorOnce,
    mockGetXmdNetworkOnce,
    mockGetXmdNetworkErrorOnce,
};
