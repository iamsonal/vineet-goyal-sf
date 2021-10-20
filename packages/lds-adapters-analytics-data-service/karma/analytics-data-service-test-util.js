import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/analytics/data-service/sync`;
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

function getConnectorMatcher(config) {
    const { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/connectors/${id}`,
        queryParams: {},
    });
}

function getConnectorsMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/connectors`,
        queryParams: {},
    });
}

function getConnectionsMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/connections`,
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
        basePath: `${URL_BASE}/connections/${id}`,
        queryParams: {},
    });
}
function expireAsset() {
    timekeeper.travel(Date.now() + ASSET_TTL + 1);
}

export {
    URL_BASE,
    mockGetConnectorsNetworkOnce,
    mockGetConnectorsNetworkErrorOnce,
    mockGetConnectionsNetworkOnce,
    mockGetConnectionsNetworkErrorOnce,
    mockGetConnectorNetworkOnce,
    mockGetConnectorNetworkErrorOnce,
    mockGetConnectionNetworkOnce,
    mockGetConnectionNetworkErrorOnce,
    expireAsset,
};
