import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_SYNC_BASE = `/analytics/data-service/sync`;
const URL_DATABASE_BASE = `/analytics/data-service/databases`;
const URL_CATALOG_BASE = `/analytics/data-service/catalog`;

const ASSET_TTL = 5000;
// Data Connectors
function mockGetConnectorsNetworkOnce(config, mockData) {
    const paramMatch = getConnectorsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectorsNetworkErrorOnce(config, mockData) {
    const paramMatch = getConnectorsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Data Connectors
function mockGetConnectionsNetworkOnce(config, mockData) {
    const paramMatch = getConnectionsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectionsNetworkErrorOnce(config, mockData) {
    const paramMatch = getConnectionsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetConnectorNetworkOnce(config, mockData) {
    const paramMatch = getConnectorMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectorNetworkErrorOnce(config, mockData) {
    const paramMatch = getConnectorMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetConnectionNetworkOnce(config, mockData) {
    const paramMatch = getConnectionMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectionNetworkErrorOnce(config, mockData) {
    const paramMatch = getConnectionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockCreateConnectionNetworkOnce(config, mockData) {
    const paramMatch = createDataConnectorsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetFieldsNetworkOnce(config, mockData) {
    const paramMatch = getFieldsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCreateConnectionNetworkErrorOnce(config, mockData) {
    const paramMatch = createDataConnectorsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Data connector source objects
function mockGetConnectionSourceObjectsNetworkOnce(config, mockData) {
    const paramMatch = getConnectorSourceObjectsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectionSourceObjectsNetworkErrorOnce(config, mockData) {
    const paramMatch = getConnectorSourceObjectsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Data connector source object
function mockGetConnectionSourceObjectNetworkOnce(config, mockData) {
    const paramMatch = mockGetConnectionSourceObjectMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetConnectionSourceObjectNetworkErrorOnce(config, mockData) {
    const paramMatch = mockGetConnectionSourceObjectMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetConnectionSourceObjectMatcher(config) {
    const { id, sourceObjectName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections/${id}/source-objects/${sourceObjectName}`,
        queryParams: {},
    });
}

function getConnectorSourceObjectsMatcher(config) {
    const { id, page, pageSize } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections/${id}/source-objects`,
        queryParams: {
            page,
            pageSize,
        },
    });
}

function createDataConnectorsMatcher(config) {
    return sinon.match({
        body: {
            ...config,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections`,
        queryParams: {},
    });
}

function mockGetFieldsNetworkErrorOnce(config, mockData) {
    const paramMatch = getFieldsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// targets
function mockGetTargetNetworkOnce(config, mockData) {
    const paramMatch = getTargetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetTargetNetworkErrorOnce(config, mockData) {
    const paramMatch = getTargetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetTargetsNetworkOnce(config, mockData) {
    const paramMatch = getTargetsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetTargetsNetworkErrorOnce(config, mockData) {
    const paramMatch = getTargetsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockCreateTargetNetworkOnce(config, mockData) {
    const paramMatch = createTargetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockCreateTargetNetworkErrorOnce(config, mockData) {
    const paramMatch = createTargetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateTargetNetworkOnce(config, mockData) {
    const paramMatch = updateTargetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockUpdateTargetNetworkErrorOnce(config, mockData) {
    const paramMatch = updateTargetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockDeleteTargetNetworkOnce(config, mockData) {
    const paramMatch = deleteTargetMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteTargetNetworkErrorOnce(config, mockData) {
    const paramMatch = deleteTargetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getConnectorMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connectors/${id}`,
        queryParams: {},
    });
}

function getConnectorsMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connectors`,
        queryParams: {},
    });
}

function getConnectionsMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections`,
        queryParams: {},
    });
}

function getConnectionMatcher(config) {
    const { id } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections/${id}`,
        queryParams: {},
    });
}

function getFieldsMatcher(config) {
    const { id, sourceObjectName, page, pageSize, q } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/connections/${id}/source-objects/${sourceObjectName}/fields`,
        queryParams: {
            page,
            pageSize,
            q,
        },
    });
}

function getTargetsMatcher(config) {
    const { connectionId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/targets`,
        queryParams: {
            connectionId,
        },
    });
}

function getTargetMatcher(config) {
    const { id } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/targets/${id}`,
        queryParams: {},
    });
}

function createTargetMatcher(config) {
    const { targetInput } = config;
    return sinon.match({
        body: {
            targetInput,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/targets`,
        queryParams: {},
    });
}

function updateTargetMatcher(config) {
    const { id, targetInput } = config;
    return sinon.match({
        body: {
            targetInput,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/targets/${id}`,
        queryParams: {},
    });
}

function deleteTargetMatcher(config) {
    const { id } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_SYNC_BASE}/targets/${id}`,
        queryParams: {},
    });
}

// Schemas
function mockGetSchemasNetworkOnce(config, mockData) {
    const paramMatch = getSchemasMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetSchemasNetworkErrorOnce(config, mockData) {
    const paramMatch = getSchemasMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Schema
function mockGetSchemaNetworkOnce(config, mockData) {
    const paramMatch = getSchemaMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetSchemaNetworkErrorOnce(config, mockData) {
    const paramMatch = getSchemaMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Catalog Tables
function mockGetCatalogTablesNetworkOnce(config, mockData) {
    const paramMatch = getCatalogTablesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetCatalogTablesNetworkErrorOnce(config, mockData) {
    const paramMatch = getCatalogTablesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Catalog Table
function mockGetCatalogTableNetworkOnce(config, mockData) {
    const paramMatch = getCatalogTableMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetCatalogTableNetworkErrorOnce(config, mockData) {
    const paramMatch = getCatalogTableMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockDeleteCatalogTableNetworkOnce(config, mockData = {}) {
    const paramMatch = deleteCatalogTableMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockDeleteCatalogTableNetworkErrorOnce(config, mockData = {}) {
    const paramMatch = deleteCatalogTableMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Databases
function mockGetDatabasesNetworkOnce(config, mockData) {
    const paramMatch = getDatabasesMatcher();
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDatabasesNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatabasesMatcher();
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Database
function mockGetDatabaseNetworkOnce(config, mockData) {
    const paramMatch = getDatabaseMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}
function mockGetDatabaseNetworkErrorOnce(config, mockData) {
    const paramMatch = getDatabaseMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getSchemasMatcher(config) {
    const { dbName } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_DATABASE_BASE}/${dbName}/schemas`,
        method: 'get',
        body: null,
    });
}

function getSchemaMatcher(config) {
    const { dbName, schemaName } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_DATABASE_BASE}/${dbName}/schemas/${schemaName}`,
        method: 'get',
        body: null,
    });
}

function getCatalogTablesMatcher(config) {
    const { dbName, schemaName, userId } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_CATALOG_BASE}/tables`,
        method: 'get',
        body: null,
        queryParams: { database: dbName, schema: schemaName, userId },
    });
}

function getCatalogTableMatcher(config) {
    const { userId, qualifiedName } = config;

    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_CATALOG_BASE}/tables/${qualifiedName}`,
        method: 'get',
        body: null,
        queryParams: { userId },
    });
}

function deleteCatalogTableMatcher(config) {
    const { qualifiedName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'delete',
        baseUri: BASE_URI,
        basePath: `${URL_CATALOG_BASE}/tables/${qualifiedName}`,
    });
}

function getDatabasesMatcher() {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_DATABASE_BASE}`,
        method: 'get',
        body: null,
    });
}

function getDatabaseMatcher(config) {
    const { dbName } = config;
    return sinon.match({
        baseUri: BASE_URI,

        basePath: `${URL_DATABASE_BASE}/${dbName}`,
        method: 'get',
        body: null,
    });
}

function expireAsset() {
    timekeeper.travel(Date.now() + ASSET_TTL + 1);
}

export {
    URL_CATALOG_BASE,
    mockGetConnectorsNetworkOnce,
    mockGetConnectorsNetworkErrorOnce,
    mockGetConnectionsNetworkOnce,
    mockGetConnectionsNetworkErrorOnce,
    mockGetConnectorNetworkOnce,
    mockGetConnectorNetworkErrorOnce,
    mockGetConnectionNetworkOnce,
    mockGetConnectionNetworkErrorOnce,
    mockCreateConnectionNetworkOnce,
    mockCreateConnectionNetworkErrorOnce,
    mockGetConnectionSourceObjectsNetworkOnce,
    mockGetConnectionSourceObjectsNetworkErrorOnce,
    mockGetConnectionSourceObjectNetworkOnce,
    mockGetConnectionSourceObjectNetworkErrorOnce,
    mockGetFieldsNetworkOnce,
    mockGetFieldsNetworkErrorOnce,
    mockGetTargetNetworkOnce,
    mockGetTargetNetworkErrorOnce,
    mockGetTargetsNetworkOnce,
    mockGetTargetsNetworkErrorOnce,
    mockCreateTargetNetworkOnce,
    mockCreateTargetNetworkErrorOnce,
    mockUpdateTargetNetworkOnce,
    mockUpdateTargetNetworkErrorOnce,
    mockDeleteTargetNetworkOnce,
    mockDeleteTargetNetworkErrorOnce,
    expireAsset,
    mockGetSchemasNetworkOnce,
    mockGetSchemasNetworkErrorOnce,
    mockGetSchemaNetworkOnce,
    mockGetSchemaNetworkErrorOnce,
    mockGetCatalogTablesNetworkOnce,
    mockGetCatalogTablesNetworkErrorOnce,
    mockGetCatalogTableNetworkOnce,
    mockGetCatalogTableNetworkErrorOnce,
    mockGetDatabasesNetworkOnce,
    mockGetDatabasesNetworkErrorOnce,
    mockGetDatabaseNetworkOnce,
    mockGetDatabaseNetworkErrorOnce,
    mockDeleteCatalogTableNetworkOnce,
    mockDeleteCatalogTableNetworkErrorOnce,
};
