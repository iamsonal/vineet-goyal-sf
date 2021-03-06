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

export function mockPostServicePlanTemplateDetailsNetwokOnce(config, mockData) {
    const paramMatch = postServicePlanTemplateDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPostServicePlanTemplateDetailsNetwokErrorOnce(config, mockData) {
    const paramMatch = postServicePlanTemplateDetailsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function postServicePlanTemplateDetailsMatcher(config) {
    const { servicePlanTemplateId, actionType, servicePlanTemplateRecord } = config;
    return sinon.match({
        body: {
            servicePlanTemplateRecord,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/serviceplan-templates/${servicePlanTemplateId}/actions/${actionType}`,
        queryParams: {},
    });
}

export function mockGetSPTWithChildRecordsNetworkOnce(config, mockData) {
    const paramMatch = getSPTWithChildRecordsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetSPTWithChildRecordsNetworkErrorOnce(config, mockData) {
    const paramMatch = getSPTWithChildRecordsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getSPTWithChildRecordsMatcher(config) {
    const { servicePlanTemplateId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/serviceplan-templates/${servicePlanTemplateId}`,
        queryParams: {},
    });
}

export function mockPostCaseServicePlanDetailsNetwokOnce(config, mockData) {
    const paramMatch = postCaseServicePlanDetailsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPostCaseServicePlanDetailsNetwokErrorOnce(config, mockData) {
    const paramMatch = postCaseServicePlanDetailsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function postCaseServicePlanDetailsMatcher(config) {
    const { caseServicePlanRecord } = config;
    return sinon.match({
        body: {
            caseServicePlanRecord,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/case-service-plans`,
        queryParams: {},
    });
}

export function mockSearchGoalDefinitionByNameNetworkOnce(config, mockData) {
    const paramMatch = searchGoalDefinitionByNameMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockSearchGoalDefinitionByNameNetworkErrorOnce(config, mockData) {
    const paramMatch = searchGoalDefinitionByNameMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function searchGoalDefinitionByNameMatcher(config) {
    let { query } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/goal-definitions`,
        queryParams: query,
    });
}

export function mockSearchBenefitsByNameNetworkOnce(config, mockData) {
    const paramMatch = searchBenefitsByNameMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockGetCaseServicePlanNetworkOnce(config, mockData) {
    const paramMatch = getCaseServicePlanMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

export function mockSearchBenefitsByNameNetworkErrorOnce(config, mockData) {
    const paramMatch = searchBenefitsByNameMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetCaseServicePlanNetworkErrorOnce(config, mockData) {
    const paramMatch = getCaseServicePlanMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function searchBenefitsByNameMatcher(config) {
    let { query } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/benefits`,
        queryParams: query,
    });
}

function getCaseServicePlanMatcher(config) {
    let { caseServicePlanId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/socialcare/case-service-plans/${caseServicePlanId}`,
        queryParams: {},
    });
}

/**
 * Force a cache expiration for searchData by fast-forwarding time past the
 * searchData TTL
 */
export function expireSearchData() {
    timekeeper.travel(Date.now() + INTERACTION_TTL + 1);
}
