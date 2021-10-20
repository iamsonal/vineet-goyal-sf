// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v54.0';
const CONNECT_BASE_URI = `/services/data/${API_VERSION}`;
const PROPERTIES_TTL = 3600000;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}
export function mockGetTagsByRecordIdNetworkOnce(config, mockData) {
    const paramMatch = getTagsByRecordIdMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagsByRecordIdNetworkErrorOnce(config, mockData) {
    const paramMatch = getTagsByRecordIdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagsByRecordIdNetworkSequence(config, mockData) {
    const paramMatch = getTagsByRecordIdMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function expireGetTagsByRecordId() {
    timekeeper.travel(Date.now() + PROPERTIES_TTL + 1);
}

function getTagsByRecordIdMatcher(config) {
    let { recordId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/interest-tags/assignments/entity/${recordId}`,
        queryParams: {},
    });
}
