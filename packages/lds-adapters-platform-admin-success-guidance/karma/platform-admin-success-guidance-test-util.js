import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/assistant-platform`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetQuestionnairesNetworkOnce(config, mockData) {
    const paramMatch = getQuestionnairesMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetQuestionnairesNetworkErrorOnce(config, mockData) {
    const paramMatch = getQuestionnairesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetQuestionnaireNetworkOnce(config, mockData) {
    const paramMatch = getQuestionnaireMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetQuestionnaireNetworkErrorOnce(config, mockData) {
    const paramMatch = getQuestionnaireMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetAssistantNetworkOnce(config, mockData) {
    const paramMatch = getAssistantMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetAssistantNetworkErrorOnce(config, mockData) {
    const paramMatch = getAssistantMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveAssistantNetworkOnce(config, mockData) {
    const paramMatch = getSaveAssistantMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveAssistantNetworkErrorOnce(config, mockData) {
    const paramMatch = getSaveAssistantMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveQuestionnaireNetworkOnce(config, mockData) {
    const paramMatch = getSaveQuestionnaireMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveQuestionnaireNetworkErrorOnce(config, mockData) {
    const paramMatch = getSaveQuestionnaireMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetAssistantListNetworkOnce(config, mockData) {
    const paramMatch = getAssistantListMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetAssistantListNetworkErrorOnce(config, mockData) {
    const paramMatch = getAssistantListMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveAssistantListNetworkOnce(config, mockData) {
    const paramMatch = getSaveAssistantListMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveAssistantListNetworkErrorOnce(config, mockData) {
    const paramMatch = getSaveAssistantListMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockEvaluateStepNetworkOnce(config, mockData) {
    const paramMatch = getEvaluateStepMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockEvaluateStepNetworkErrorOnce(config, mockData) {
    const paramMatch = getEvaluateStepMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockInitializeNetworkOnce(config, mockData) {
    const paramMatch = getInitializeMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockInitializeNetworkErrorOnce(config, mockData) {
    const paramMatch = getInitializeMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getQuestionnaireMatcher(config) {
    let { questionnaireName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/questionnaire/${questionnaireName}`,
        queryParams: {},
    });
}

function getQuestionnairesMatcher(config) {
    let { assistantName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantName}/questionnaires`,
        queryParams: {},
    });
}

function getAssistantMatcher(config) {
    let { assistantName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantName}`,
        queryParams: {},
    });
}

function getSaveAssistantMatcher(config) {
    let { assistantName, assistantData } = config;

    return sinon.match({
        body: { assistantData },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantName}`,
        queryParams: {},
    });
}

function getSaveQuestionnaireMatcher(config) {
    let { questionnaireName, questionnaireData } = config;

    return sinon.match({
        body: { questionnaireData },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/questionnaire/${questionnaireName}`,
        queryParams: {},
    });
}

function getAssistantListMatcher(config) {
    let { assistantTarget } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantTarget}/list`,
        queryParams: {},
    });
}

function getSaveAssistantListMatcher(config) {
    let { assistantTarget, assistantData } = config;

    return sinon.match({
        body: { assistantData },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantTarget}/list`,
        queryParams: {},
    });
}

function getEvaluateStepMatcher(config) {
    let { stepName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/step/${stepName}`,
        queryParams: {},
    });
}

function getInitializeMatcher(config) {
    let { assistantTarget } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'put',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${assistantTarget}/initialize`,
        queryParams: {},
    });
}
