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

export function mockGetInteractionInsightsNetworkOnce(config, mockData) {
    const paramMatch = getInteractionInsightsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetInteractionInsightsNetworkErrorOnce(config, mockData) {
    const paramMatch = getInteractionInsightsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetContactsInteractionsNetworkOnce(config, mockData) {
    const paramMatch = getContactsInteractionsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetContactsInteractionsNetworkErrorOnce(config, mockData) {
    const paramMatch = getContactsInteractionsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetDealPartiesNetworkOnce(config, mockData) {
    const paramMatch = getDealPartiesMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetDealPartiesNetworkErrorOnce(config, mockData) {
    const paramMatch = getDealPartiesMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getInteractionInsightsMatcher(config) {
    let { accountId, systemConext, showACR, limit, offset, isDirectContacts } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/financialservices/interaction-insights/${accountId}`,
        queryParams: { systemConext, showACR, limit, offset, isDirectContacts },
    });
}

function getContactsInteractionsMatcher(config) {
    let { systemContext, contactIds, relatedRecordId } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/financialservices/contacts-interactions`,
        queryParams: { systemContext, contactIds, relatedRecordId },
    });
}

function getDealPartiesMatcher(config) {
    let { financialDealId, partyRoles } = config;

    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/financialservices/deal-parties/${financialDealId}`,
        queryParams: { partyRoles },
    });
}
