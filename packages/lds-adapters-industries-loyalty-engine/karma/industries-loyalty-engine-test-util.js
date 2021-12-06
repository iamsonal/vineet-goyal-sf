import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetProgramProcessRuleNetworkOnce(config, mockData) {
    const paramMatch = getProgramProcessRuleVariableMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetProgramProcessRuleNetworkErrorOnce(config, mockData) {
    const paramMatch = getProgramProcessRuleVariableMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUpsertProgramProcessRuleNetworkOnce(config, mockData) {
    const paramMatch = getUpsertProgramProcessRuleVariableMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUpsertProgramProcessRuleNetworkErrorOnce(config, mockData) {
    const paramMatch = getUpsertProgramProcessRuleVariableMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getProgramProcessRuleVariableMatcher(config) {
    let { programName, processName, ruleName } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/loyalty/programs/${programName}/processes/${processName}/rule/${ruleName}`,
    });
}

function getUpsertProgramProcessRuleVariableMatcher(config) {
    let { programName, processName, ruleName, programProcessRule } = config;

    return sinon.match({
        body: {
            programProcessRule,
        },
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/connect/loyalty/programs/${programName}/processes/${processName}/rule/${ruleName}`,
    });
}
