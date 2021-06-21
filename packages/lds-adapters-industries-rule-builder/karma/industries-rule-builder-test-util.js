import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetDecisionMatricDetailsNetworkOnce(config, mockData) {
    const paramMatch = getDecisionMatricDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockDecisionMatricDetailsNetworkErrorOnce(config, mockData) {
    const paramMatch = getDecisionMatricDetailsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetCalcProcVersionDetailsNetworkOnce(config, mockData) {
    const paramMatch = getCalcProcVersionDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetCalcProcVersionDetailsNetworkErrorOnce(config, mockData) {
    const paramMatch = getCalcProcVersionDetailsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPostCalcProcVersionDetailsNetworkOnce(config, mockData) {
    const paramMatch = postCalcProcVersionDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPostCalcProcVersionDetailsNetworkErrorOnce(config, mockData) {
    const paramMatch = postCalcProcVersionDetailsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSearchCalculationProcedureNetworkOnce(config, mockData) {
    const paramMatch = searchCalculationProcedureMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSearchCalculationProcedureNetworkErrorOnce(config, mockData) {
    const paramMatch = searchCalculationProcedureMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getDecisionMatricDetailsMatcher(config) {
    let { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices/${id}`,
        queryParams: {},
    });
}

function getCalcProcVersionDetailsMatcher(config) {
    let { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/version-definitions/${id}`,
        queryParams: {},
    });
}

function postCalcProcVersionDetailsMatcher(config) {
    let { calculationProcedureVersionDefinition } = config;

    return sinon.match({
        body: {
            calculationProcedureVersionDefinition,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/version-definitions`,
        queryParams: {},
    });
}

function searchCalculationProcedureMatcher(config) {
    let { searchKey } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services`,
        queryParams: {
            searchKey,
        },
    });
}
