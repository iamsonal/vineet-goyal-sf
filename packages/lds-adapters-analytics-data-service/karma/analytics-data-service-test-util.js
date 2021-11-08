import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_SYNC_BASE = `/analytics/data-service/sync`;
const URL_DATABASE_BASE = `/analytics/data-service/databases`;
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

// Tables
function mockGetTablesNetworkOnce(config, mockData) {
    const paramMatch = getTablesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetTablesNetworkErrorOnce(config, mockData) {
    const paramMatch = getTablesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

// Table
function mockGetTableNetworkOnce(config, mockData) {
    const paramMatch = getTableMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetTableNetworkErrorOnce(config, mockData) {
    const paramMatch = getTableMatcher(config);
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

function getTablesMatcher(config) {
    const { dbName, schemaName } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_DATABASE_BASE}/${dbName}/schemas/${schemaName}/tables`,
        method: 'get',
        body: null,
    });
}

function getTableMatcher(config) {
    const { dbName, schemaName, tableName } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_DATABASE_BASE}/${dbName}/schemas/${schemaName}/tables/${tableName}`,
        method: 'get',
        body: null,
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
    expireAsset,
    mockGetSchemasNetworkOnce,
    mockGetSchemasNetworkErrorOnce,
    mockGetSchemaNetworkOnce,
    mockGetSchemaNetworkErrorOnce,
    mockGetTablesNetworkOnce,
    mockGetTablesNetworkErrorOnce,
    mockGetTableNetworkOnce,
    mockGetTableNetworkErrorOnce,
    mockGetDatabasesNetworkOnce,
    mockGetDatabasesNetworkErrorOnce,
    mockGetDatabaseNetworkOnce,
    mockGetDatabaseNetworkErrorOnce,
};
