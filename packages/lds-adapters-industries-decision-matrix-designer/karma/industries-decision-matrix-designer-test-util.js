import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetColumnsNetworkOnce(config, mockData) {
    const paramMatch = getColumnsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetColumnsNetworkErrorOnce(config, mockData) {
    const paramMatch = getColumnsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetRowsNetworkOnce(config, mockData) {
    const paramMatch = getRowsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetRowsNetworkErrorOnce(config, mockData) {
    const paramMatch = getRowsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveRowsNetworkOnce(config, mockData) {
    const paramMatch = getSaveRowsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveRowsNetworkErrorOnce(config, mockData) {
    const paramMatch = getSaveRowsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveColumnsNetworkOnce(config, mockData) {
    const paramMatch = getSaveColumnsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveColumnsNetworkErrorOnce(config, mockData) {
    const paramMatch = getSaveColumnsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getColumnsMatcher(config) {
    let { matrixId } = config;

    return sinon.match({
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices/${matrixId}/columns`,
    });
}

function getSaveColumnsMatcher(config) {
    let { matrixId, columns } = config;

    return sinon.match({
        body: { columns },
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices/${matrixId}/columns`,
    });
}

function getRowsMatcher(config) {
    let { matrixId, versionId } = config;

    return sinon.match({
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices/${matrixId}/versions/${versionId}/rows`,
        queryParams: {},
    });
}

function getSaveRowsMatcher(config) {
    let { matrixId, versionId, rowsInput } = config;
    return sinon.match({
        body: { rowsInput },
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices/${matrixId}/versions/${versionId}/rows`,
    });
}
