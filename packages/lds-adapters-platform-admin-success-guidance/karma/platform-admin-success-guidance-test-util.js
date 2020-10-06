import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v51.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/guidance`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetActiveQuestionnairesNetworkOnce(config, mockData) {
    const paramMatch = getActiveQuestionnaireMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetActiveQuestionnairesNetworkErrorOnce(config, mockData) {
    const paramMatch = getActiveQuestionnaireMatcher(config);
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

function getQuestionnaireMatcher(config) {
    let { assistantGroup, questionnaireId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/assistant/${assistantGroup}/questionnaire/${questionnaireId}`,
        queryParams: {},
    });
}

function getActiveQuestionnaireMatcher(config) {
    let { assistantGroup } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/assistant/${assistantGroup}/questionnaires`,
        queryParams: {},
    });
}

function getAssistantMatcher(config) {
    let { assistantGroup } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/assistant/${assistantGroup}`,
        queryParams: {},
    });
}

function getSaveAssistantMatcher(config) {
    let { assistantGroup, assistantData } = config;

    return sinon.match({
        body: { assistantData },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/assistant/${assistantGroup}`,
        queryParams: {},
    });
}

function getSaveQuestionnaireMatcher(config) {
    let { assistantGroup, questionnaireId, questionnaireData } = config;

    return sinon.match({
        body: { questionnaireData },
        headers: {},
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/assistant/${assistantGroup}/questionnaire/${questionnaireId}`,
        queryParams: {},
    });
}
