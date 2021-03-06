import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';
import timekeeper from 'timekeeper';

import sinon from 'sinon';

const API_VERSION = 'v55.0';
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

// Actions
function mockGetActionsNetworkOnce(config, mockData) {
    const paramMatch = getActionsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetActionsNetworkErrorOnce(config, mockData) {
    const paramMatch = getActionsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getActionsMatcher(config) {
    let { entityId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/actions/${entityId}`,
        queryParams: {},
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

function mockDeleteDataConnectorNetworkOnce(config, mockData = {}) {
    const paramMatch = deleteDataConnectorMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteDataConnectorNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = deleteDataConnectorMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function deleteDataConnectorMatcher(config) {
    let { connectorIdOrApiName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}`,
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

// Data connector source object preview
function mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectDataPreviewWithFieldsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataConnectorSourceObjectDataPreviewWithFieldsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataConnectorSourceObjectDataPreviewWithFieldsMatcher(config) {
    const { uriParams, body } = config;
    const { connectorIdOrApiName, sourceObjectName } = uriParams;
    return sinon.match({
        body,
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataConnectors/${connectorIdOrApiName}/sourceObjects/${sourceObjectName}/dataPreview`,
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

// Dataflows
function mockGetDataflowsNetworkOnce(config, mockData) {
    const paramMatch = getDataflowsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDataflowsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDataflowsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowsMatcher(config) {
    let { q } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflows`,
        queryParams: {
            q,
        },
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

function mockUpdateDatasetNetworkOnce(config, mockData = {}) {
    const paramMatch = updateDatasetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockUpdateDatasetNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = updateDatasetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateDatasetMatcher(config) {
    let { datasetIdOrApiName, dataset } = config;
    return sinon.match({
        body: {
            dataset,
        },
        headers: {},
        method: 'patch',
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
    const { datasetTypes, folderId, licenseType, page, pageSize, q, scope, sort } = config;

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
            sort,
        },
    });
}

// Dataset version
function mockGetDatasetVersionNetworkOnce(config, mockData) {
    const paramMatch = getDatasetVersionMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDatasetVersionNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatasetVersionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDatasetVersionMatcher(config) {
    let { idOfDataset, versionId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${idOfDataset}/versions/${versionId}`,
        queryParams: {},
    });
}

function mockUpdateDatasetVersionNetworkOnce(config, mockData) {
    const paramMatch = updateDatasetVersionMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateDatasetVersionNetworkErrorOnce(config, mockData) {
    const paramMatch = updateDatasetVersionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateDatasetVersionMatcher(config) {
    const { datasetIdOrApiName, versionId, datasetVersion } = config;

    return sinon.match({
        body: {
            datasetVersion,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${datasetIdOrApiName}/versions/${versionId}`,
        queryParams: {},
    });
}

function mockGetDatasetVersionsNetworkOnce(config, mockData) {
    const paramMatch = getDatasetVersionsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDatasetVersionsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatasetVersionsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDatasetVersionsMatcher(config) {
    let { idOfDataset } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${idOfDataset}/versions`,
        queryParams: {},
    });
}

function mockCreateDatasetVersionNetworkOnce(config, mockData) {
    const paramMatch = createDatasetVersionMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockCreateDatasetVersionNetworkErrorOnce(config, mockData) {
    const paramMatch = createDatasetVersionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function createDatasetVersionMatcher(config) {
    const { datasetIdOrApiName, sourceVersion } = config;
    return sinon.match({
        body: {
            sourceVersion,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/datasets/${datasetIdOrApiName}/versions`,
        queryParams: {},
    });
}

// Dataset version security coverage
function mockGetSecurityCoverageDatasetVersionNetworkOnce(config, mockData) {
    const paramMatch = getSecurityCoverageDatasetVersionMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetSecurityCoverageDatasetVersionNetworkErrorOnce(config, mockData) {
    const paramMatch = getSecurityCoverageDatasetVersionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getSecurityCoverageDatasetVersionMatcher(config) {
    let { idOfDataset, versionId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/security/coverage/datasets/${idOfDataset}/versions/${versionId}`,
        queryParams: {},
    });
}

// Dependencies
function mockGetDependenciesNetworkOnce(config, mockData) {
    const paramMatch = getDependenciesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDependenciesNetworkErrorOnce(config, mockData) {
    const paramMatch = getDependenciesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDependenciesMatcher(config) {
    let { assetId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dependencies/${assetId}`,
        queryParams: {},
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
    let {
        format,
        licenseType,
        page,
        pageSize,
        q,
        sort,
        order,
        lastModifiedAfter,
        lastModifiedBefore,
        nextScheduledAfter,
        nextScheduledBefore,
        status,
    } = config;
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
            order,
            lastModifiedAfter,
            lastModifiedBefore,
            nextScheduledAfter,
            nextScheduledBefore,
            status,
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

function mockUpdateRecipeNetworkOnce(config, mockData) {
    const paramMatch = updateRecipeMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateRecipeNetworkErrorOnce(config, mockData) {
    const paramMatch = updateRecipeMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateRecipeMatcher(config) {
    const { id, recipeObject, enableEditorValidation, validationContext } = config;

    return sinon.match({
        body: {
            recipeObject,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes/${id}`,
        queryParams: {
            enableEditorValidation,
            validationContext,
        },
    });
}

// Recipe Notification
function mockGetRecipeNotificationNetworkOnce(config, mockData) {
    const paramMatch = getRecipeNotificationMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecipeNotificationNetworkErrorOnce(config, mockData) {
    const paramMatch = getRecipeNotificationMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getRecipeNotificationMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes/${id}/notification`,
        queryParams: {},
    });
}

function mockUpdateRecipeNotificationNetworkOnce(config, mockData) {
    const paramMatch = updateRecipeNotificationMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateRecipeNotificationNetworkErrorOnce(config, mockData) {
    const paramMatch = updateRecipeNotificationMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function updateRecipeNotificationMatcher(config) {
    const { id, recipeNotification } = config;

    return sinon.match({
        body: {
            recipeNotification,
        },
        headers: {},
        method: 'put',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/recipes/${id}/notification`,
        queryParams: {},
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

// Wave Templates
function mockGetWaveTemplatesNetworkOnce(config, mockData) {
    const paramMatch = getWaveTemplatesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetWaveTemplatesNetworkErrorOnce(config, mockData) {
    const paramMatch = getWaveTemplatesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getWaveTemplatesMatcher(config) {
    let { options, type } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/templates`,
        queryParams: {
            options,
            type,
        },
    });
}

// Wave Template
function mockGetWaveTemplateNetworkOnce(config, mockData) {
    const paramMatch = getWaveTemplateMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetWaveTemplateNetworkErrorOnce(config, mockData) {
    const paramMatch = getWaveTemplateMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getWaveTemplateMatcher(config) {
    let { templateIdOrApiName, options } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/templates/${templateIdOrApiName}`,
        queryParams: { options },
    });
}

// Wave Template Config
function mockGetWaveTemplateConfigNetworkOnce(config, mockData) {
    const paramMatch = getWaveTemplateConfigMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetWaveTemplateConfigNetworkErrorOnce(config, mockData) {
    const paramMatch = getWaveTemplateConfigMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getWaveTemplateConfigMatcher(config) {
    let { templateIdOrApiName, options, disableApex } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/templates/${templateIdOrApiName}/configuration`,
        queryParams: { options, disableApex },
    });
}

// Wave Template Release Notes
function mockGetWaveTemplateReleaseNotesNetworkOnce(config, mockData) {
    const paramMatch = getWaveTemplateReleaseNotesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetWaveTemplateReleaseNotesNetworkErrorOnce(config, mockData) {
    const paramMatch = getWaveTemplateReleaseNotesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getWaveTemplateReleaseNotesMatcher(config) {
    let { templateIdOrApiName } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/templates/${templateIdOrApiName}/releasenotes`,
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
    mockGetActionsNetworkOnce,
    mockGetActionsNetworkErrorOnce,
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
    mockDeleteDataConnectorNetworkOnce,
    mockDeleteDataConnectorNetworkErrorOnce,
    mockGetDataConnectorsNetworkOnce,
    mockGetDataConnectorsNetworkErrorOnce,
    mockGetDataConnectorSourceObjectNetworkOnce,
    mockGetDataConnectorSourceObjectNetworkErrorOnce,
    mockGetDataConnectorSourceFieldsNetworkOnce,
    mockGetDataConnectorSourceFieldsNetworkErrorOnce,
    mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce,
    mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkErrorOnce,
    mockGetDataConnectorSourceObjectsNetworkOnce,
    mockGetDataConnectorSourceObjectsNetworkErrorOnce,
    mockGetDataConnectorTypesNetworkOnce,
    mockGetDataConnectorTypesNetworkErrorOnce,
    mockIngestDataConnectorNetworkOnce,
    mockIngestDataConnectorNetworkErrorOnce,
    mockGetDataConnectorStatusNetworkOnce,
    mockGetDataConnectorStatusNetworkErrorOnce,
    mockGetDataflowsNetworkOnce,
    mockGetDataflowsNetworkErrorOnce,
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
    mockUpdateDatasetNetworkOnce,
    mockUpdateDatasetNetworkErrorOnce,
    mockGetDatasetsNetworkOnce,
    mockGetDatasetsNetworkErrorOnce,
    mockGetDatasetVersionNetworkOnce,
    mockGetDatasetVersionNetworkErrorOnce,
    mockGetDependenciesNetworkOnce,
    mockGetDependenciesNetworkErrorOnce,
    mockUpdateDatasetVersionNetworkOnce,
    mockUpdateDatasetVersionNetworkErrorOnce,
    mockGetDatasetVersionsNetworkOnce,
    mockGetDatasetVersionsNetworkErrorOnce,
    mockCreateDatasetVersionNetworkOnce,
    mockCreateDatasetVersionNetworkErrorOnce,
    mockGetSecurityCoverageDatasetVersionNetworkOnce,
    mockGetSecurityCoverageDatasetVersionNetworkErrorOnce,
    mockGetRecipesNetworkOnce,
    mockGetRecipesNetworkErrorOnce,
    mockGetRecipeNetworkOnce,
    mockGetRecipeNetworkErrorOnce,
    mockDeleteRecipeNetworkOnce,
    mockDeleteRecipeNetworkErrorOnce,
    mockUpdateRecipeNetworkOnce,
    mockUpdateRecipeNetworkErrorOnce,
    mockGetRecipeNotificationNetworkOnce,
    mockGetRecipeNotificationNetworkErrorOnce,
    mockUpdateRecipeNotificationNetworkOnce,
    mockUpdateRecipeNotificationNetworkErrorOnce,
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
    mockGetWaveTemplatesNetworkOnce,
    mockGetWaveTemplatesNetworkErrorOnce,
    mockGetWaveTemplateNetworkOnce,
    mockGetWaveTemplateNetworkErrorOnce,
    mockGetWaveTemplateConfigNetworkOnce,
    mockGetWaveTemplateConfigNetworkErrorOnce,
    mockGetWaveTemplateReleaseNotesNetworkOnce,
    mockGetWaveTemplateReleaseNotesNetworkErrorOnce,
    mockGetXmdNetworkOnce,
    mockGetXmdNetworkErrorOnce,
    expireAsset,
};
