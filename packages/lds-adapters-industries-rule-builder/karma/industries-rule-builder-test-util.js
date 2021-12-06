import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const INTERACTION_TTL = 1000;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetSimulationInputVariablesNetworkOnce(config, mockData) {
    const paramMatch = getSimulationInputVariablesMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSimulationInputVariablesNetworkErrorOnce(config, mockData) {
    const paramMatch = getSimulationInputVariablesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
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

export function mockGetCalcProcDetailsNetworkOnce(config, mockData) {
    const paramMatch = getCalcProcDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetCalcProcDetailsNetworkErrorOnce(config, mockData) {
    const paramMatch = getCalcProcDetailsMatcher(config);
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

export function mockSimulateEvaluationServiceNetworkOnce(config, mockData) {
    const paramMatch = simulateEvaluationServiceMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSimulateEvaluationServiceNetworkErrorOnce(config, mockData) {
    const paramMatch = simulateEvaluationServiceMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockActivateCalcProcedureVersionNetworkOnce(config, mockData) {
    const paramMatch = activateCalcProcedureVersionMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockActivateCalcProcedureVersionNetworkErrorOnce(config, mockData) {
    const paramMatch = activateCalcProcedureVersionMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getSimulationInputVariablesMatcher(config) {
    let { id, inputVariables } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/version-definitions/${id}/simulation`,
        queryParams: { inputVariables },
    });
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

function getCalcProcDetailsMatcher(config) {
    let { id } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/${id}`,
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

function simulateEvaluationServiceMatcher(config) {
    let { id, simulationInput } = config;

    return sinon.match({
        body: {
            simulationInput,
        },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/version-definitions/${id}/simulation`,
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

export function mockSearchDecisionMatrixByNameNetworkOnce(config, mockData) {
    const paramMatch = searchDecisionMatrixByNameMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockSearchDecisionMatrixByNameNetworkErrorOnce(config, mockData) {
    const paramMatch = searchDecisionMatrixByNameMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function searchDecisionMatrixByNameMatcher(config) {
    let { query } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/decision-matrices`,
        queryParams: query,
    });
}

function activateCalcProcedureVersionMatcher(config) {
    let { id, action } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `/connect/omnistudio/evaluation-services/version-definitions/${id}`,
        queryParams: { action },
    });
}

/**
 * Force a cache expiration for searchData by fast-forwarding time past the
 * searchData TTL
 */
export function expireSearchData() {
    timekeeper.travel(Date.now() + INTERACTION_TTL + 1);
}
