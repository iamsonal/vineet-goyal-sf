import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v52.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/wave`;

// Analytics Limits
export function mockGetAnalyticsLimitsNetworkOnce(config, mockData) {
    const paramMatch = getAnalyticsLimitsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetAnalyticsLimitsNetworkErrorOnce(config, mockData) {
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

// Dataflow Jobs
export function mockGetDataflowJobsNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDataflowJobsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowJobsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobsMatcher(config) {
    let { licenseType, pageParam, pageSize, q, status } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs`,
        queryParams: {
            licenseType,
            pageParam,
            pageSize,
            q,
            status,
        },
    });
}

// Dataflow Job
export function mockGetDataflowJobNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDataflowJobNetworkErrorOnce(config, mockData) {
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

export function mockUpdateDataflowJobNetworkOnce(config, mockData) {
    const paramMatch = updateDataflowJobMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUpdateDataflowJobNetworkErrorOnce(config, mockData) {
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
export function mockGetDataflowJobNodesNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobNodesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDataflowJobNodesNetworkErrorOnce(config, mockData) {
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
export function mockGetDataflowJobNodeNetworkOnce(config, mockData) {
    const paramMatch = getDataflowJobNodeMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDataflowJobNodeNetworkErrorOnce(config, mockData) {
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
export function mockGetDatasetNetworkOnce(config, mockData) {
    const paramMatch = getDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDatasetNetworkErrorOnce(config, mockData) {
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

// Datasets
export function mockGetDatasetsNetworkOnce(config, mockData) {
    const paramMatch = getDatasetsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDatasetsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatasetsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDatasetsMatcher(config) {
    let { folderId, page, pageSize, q, scope } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        basePath: `${URL_BASE}/datasets`,
        queryParams: {
            folderId,
            page,
            pageSize,
            q,
            scope,
        },
    });
}

// Recipes
export function mockGetRecipesNetworkOnce(config, mockData) {
    const paramMatch = getRecipesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetRecipesNetworkErrorOnce(config, mockData) {
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

// XMD
export function mockGetXmdNetworkOnce(config, mockData) {
    const paramMatch = getXmdMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetXmdNetworkErrorOnce(config, mockData) {
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
