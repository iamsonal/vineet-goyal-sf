// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/asset-creation`;
const STARTER_TEMPLATES_PATH = `${URL_BASE}/starter-templates`;
const CREATE_ASSETS_PATH = `${URL_BASE}/objects`;

export function clone(obj) {
    // this is needed from compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetStarterTemplatesNetworkOnce(config, mockData) {
    const paramMatch = getStarterTemplatesMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetStarterTemplatesNetworkErrorOnce(config, mockData) {
    const paramMatch = getStarterTemplatesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getStarterTemplatesMatcher() {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: STARTER_TEMPLATES_PATH,
        queryParams: {},
    });
}

export function mockGetStarterTemplateByIdNetworkOnce(config, mockData) {
    const paramMatch = getStarterTemplateByIdMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetStarterTemplateByIdNetworkErrorOnce(config, mockData) {
    const paramMatch = getStarterTemplateByIdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getStarterTemplateByIdMatcher(config) {
    let { starterTemplateId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/asset-creation/starter-templates/${starterTemplateId}`,
        queryParams: {},
    });
}

export function mockCreateAssetNetwokOnce(config, mockData) {
    const paramMatch = postCreateAssetMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockCreateAssetNetwokErrorOnce(config, mockData) {
    const paramMatch = postCreateAssetMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function postCreateAssetMatcher(config) {
    let { assetInput } = config;

    return sinon.match({
        body: {
            assetInput,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: CREATE_ASSETS_PATH,
        queryParams: {},
    });
}
