import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';

import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = '/sites';

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetFormNetworkOnce(config, mockData) {
    const paramMatch = getFormMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getFormMatcher(config) {
    let { siteId, formId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${siteId}/marketing-integration/forms/${formId}`,
        queryParams: {},
    });
}

export function mockSaveFormNetworkOnce(config, mockData) {
    const paramMatch = saveFormMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockSaveFormInvalidSiteIdNetworkErrorOnce(config, mockData) {
    const paramMatch = saveFormMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function saveFormMatcher(config) {
    let { siteId, ...mockInputBody } = config;

    // do not compare item content as FormInputRepresentation.formFieldsList type in raml is object, not FormFieldInputRepresentation yet
    mockInputBody.formFieldsList = mockInputBody.formFieldsList.map(() => {
        return {};
    });

    return sinon.match({
        body: mockInputBody,
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/${siteId}/marketing-integration/forms`,
        queryParams: {},
    });
}
