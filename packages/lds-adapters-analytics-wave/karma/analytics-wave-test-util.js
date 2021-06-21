import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';
import timekeeper from 'timekeeper';

import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/wave`;
const ASSET_TTL = 5000;

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

// Data Connectors
function mockGetDataConnectorsNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorsMatcher(config) {
    let { category, connectorType, scope } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors`,
        queryParams: {
            category,
            connectorType,
            scope,
        },
    });
}

function mockCreateDataConnectorNetworkOnce(config, mockData) {
    const paramMatch = createDataConnectorsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCreateDataConnectorNetworkErrorOnce(config, mockData) {
    const paramMatch = createDataConnectorsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function createDataConnectorsMatcher(config) {
    const { dataConnector } = config;
    return sinon.match({
        body: {
            dataConnector,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors`,
        queryParams: {},
    });
}

// Data connector
function mockGetDataConnectorNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorMatcher(config) {
    const { connectorIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}`,
        queryParams: {},
    });
}

function mockUpdateDataConnectorNetworkOnce(config, mockData) {
    const paramMatch = updateDataConnectorMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockUpdateDataConnectorNetworkErrorOnce(config, mockData) {
    const paramMatch = updateDataConnectorMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateDataConnectorMatcher(config) {
    const { connectorIdOrApiName, dataConnector } = config;

    return sinon.match({
        body: {
            dataConnector,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}`,
        queryParams: {},
    });
}

// Data connector source objects
function mockGetDataConnectorSourceObjectsNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorSourceObjectsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorSourceObjectsMatcher(config) {
    const { connectorIdOrApiName, page, pageSize } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/sourceObjects`,
        queryParams: {
            page,
            pageSize,
        },
    });
}

// Data connector source object
function mockGetDataConnectorSourceObjectNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorSourceObjectNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorSourceObjectMatcher(config) {
    const { connectorIdOrApiName, sourceObjectName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/sourceObjects/${sourceObjectName}`,
        queryParams: {},
    });
}

// Data connector source fields
function mockGetDataConnectorSourceFieldsNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceFieldsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorSourceFieldsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceFieldsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorSourceFieldsMatcher(config) {
    const { connectorIdOrApiName, sourceObjectName } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/sourceObjects/${sourceObjectName}/fields`,
        queryParams: {},
    });
}

// Data connector ingest
function mockIngestDataConnectorNetworkOnce(config, mockData) {
    const paramMatch = ingestDataConnectorMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockIngestDataConnectorNetworkErrorOnce(config, mockData) {
    const paramMatch = ingestDataConnectorMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function ingestDataConnectorMatcher(config) {
    const { connectorIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/ingest`,
        queryParams: {},
    });
}

// Data connector status
function mockGetDataConnectorStatusNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorStatusMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorStatusNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorStatusMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorStatusMatcher(config) {
    const { connectorIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/status`,
        queryParams: {},
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
    let { jobTypes, licenseType, page, pageSize, q, startedAfter, startedBefore, status } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs`,
        queryParams: {
            jobTypes,
            licenseType,
            page,
            pageSize,
            q,
            startedAfter,
            startedBefore,
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
    const { dataflowJob } = config;

    return sinon.match({
        body: { dataflowJob },
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
    const { dataflowjobId, dataflowJob } = config;

    return sinon.match({
        body: { dataflowJob },
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
    let { category, connector, q, sourceObject } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets`,
        queryParams: {
            category,
            connector,
            q,
            sourceObject,
        },
    });
}

function mockCreateReplicatedDatasetNetworkOnce(config, mockData) {
    const paramMatch = createReplicatedDatasetMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockCreateReplicatedDatasetNetworkErrorOnce(config, mockData) {
    const paramMatch = createReplicatedDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function createReplicatedDatasetMatcher(config) {
    const { replicatedDataset } = config;

    return sinon.match({
        body: {
            replicatedDataset,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets`,
        queryParams: {},
    });
}

// Replicated Dataset
function mockGetReplicatedDatasetNetworkOnce(config, mockData) {
    const paramMatch = getReplicatedDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetReplicatedDatasetNetworkErrorOnce(config, mockData) {
    const paramMatch = getReplicatedDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getReplicatedDatasetMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets/${id}`,
        queryParams: {},
    });
}

function mockUpdateReplicatedDatasetNetworkOnce(config, mockData) {
    const paramMatch = updateReplicatedDatasetMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateReplicatedDatasetNetworkErrorOnce(config, mockData) {
    const paramMatch = updateReplicatedDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateReplicatedDatasetMatcher(config) {
    const { id, replicatedDataset } = config;

    return sinon.match({
        body: {
            replicatedDataset,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets/${id}`,
        queryParams: {},
    });
}

function mockDeleteReplicatedDatasetNetworkOnce(config, mockData = {}) {
    const paramMatch = deleteReplicatedDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteReplicatedDatasetNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = deleteReplicatedDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function deleteReplicatedDatasetMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets/${id}`,
    });
}

// Replicated Dataset Fields
function mockGetReplicatedFieldsNetworkOnce(config, mockData) {
    const paramMatch = getReplicatedFieldsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetReplicatedFieldsNetworkErrorOnce(config, mockData) {
    const paramMatch = getReplicatedFieldsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getReplicatedFieldsMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets/${id}/fields`,
        queryParams: {},
    });
}

function mockUpdateReplicatedFieldsNetworkOnce(config, mockData) {
    const paramMatch = updateReplicatedFieldsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateReplicatedFieldsNetworkErrorOnce(config, mockData) {
    const paramMatch = updateReplicatedFieldsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateReplicatedFieldsMatcher(config) {
    const { id, replicatedFields } = config;

    return sinon.match({
        body: {
            replicatedFields,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/replicatedDatasets/${id}/fields`,
        queryParams: {},
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
    let { templateSourceId, page, pageSize, q, sort, isPinned, scope, mobileOnlyFeaturedAssets } =
        config;

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

/**
 * Force a cache expiration for baseWaveAsset types by fast-forwarding time past the
 * standard TTL.
 */
function expireAsset() {
    timekeeper.travel(Date.now() + ASSET_TTL + 1);
}

export {
    URL_BASE,
    mockExecuteQueryNetworkOnce,
    mockExecuteQueryNetworkErrorOnce,
    mockGetAnalyticsLimitsNetworkOnce,
    mockGetAnalyticsLimitsNetworkErrorOnce,
    mockCreateDataConnectorNetworkOnce,
    mockCreateDataConnectorNetworkErrorOnce,
    mockGetDataConnectorNetworkOnce,
    mockGetDataConnectorNetworkErrorOnce,
    mockUpdateDataConnectorNetworkOnce,
    mockUpdateDataConnectorNetworkErrorOnce,
    mockGetDataConnectorsNetworkOnce,
    mockGetDataConnectorsNetworkErrorOnce,
    mockGetDataConnectorSourceObjectNetworkOnce,
    mockGetDataConnectorSourceObjectNetworkErrorOnce,
    mockGetDataConnectorSourceFieldsNetworkOnce,
    mockGetDataConnectorSourceFieldsNetworkErrorOnce,
    mockGetDataConnectorSourceObjectsNetworkOnce,
    mockGetDataConnectorSourceObjectsNetworkErrorOnce,
    mockGetDataConnectorTypesNetworkOnce,
    mockGetDataConnectorTypesNetworkErrorOnce,
    mockIngestDataConnectorNetworkOnce,
    mockIngestDataConnectorNetworkErrorOnce,
    mockGetDataConnectorStatusNetworkOnce,
    mockGetDataConnectorStatusNetworkErrorOnce,
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
    mockGetReplicatedDatasetNetworkOnce,
    mockGetReplicatedDatasetNetworkErrorOnce,
    mockUpdateReplicatedDatasetNetworkOnce,
    mockUpdateReplicatedDatasetNetworkErrorOnce,
    mockGetReplicatedDatasetsNetworkOnce,
    mockGetReplicatedDatasetsNetworkErrorOnce,
    mockCreateReplicatedDatasetNetworkOnce,
    mockCreateReplicatedDatasetNetworkErrorOnce,
    mockDeleteReplicatedDatasetNetworkOnce,
    mockDeleteReplicatedDatasetNetworkErrorOnce,
    mockGetReplicatedFieldsNetworkOnce,
    mockGetReplicatedFieldsNetworkErrorOnce,
    mockUpdateReplicatedFieldsNetworkOnce,
    mockUpdateReplicatedFieldsNetworkErrorOnce,
    mockGetScheduleNetworkOnce,
    mockGetScheduleNetworkErrorOnce,
    mockUpdateScheduleNetworkOnce,
    mockUpdateScheduleNetworkErrorOnce,
    mockGetWaveFoldersNetworkOnce,
    mockGetWaveFoldersNetworkErrorOnce,
    mockGetXmdNetworkOnce,
    mockGetXmdNetworkErrorOnce,
    expireAsset,
};
