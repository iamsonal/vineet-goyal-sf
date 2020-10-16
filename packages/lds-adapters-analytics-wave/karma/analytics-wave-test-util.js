import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v51.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/wave`;

// Dataflow Jobs
export function mockGetDataflowJobsNetworkOnce(mockData) {
    const paramMatch = getDataflowJobsMatcher();
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetDataflowJobsNetworkErrorOnce(mockData) {
    const paramMatch = getDataflowJobsMatcher();
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDataflowJobsMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/dataflowjobs`,
        queryParams: {},
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
