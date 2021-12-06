// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const CONNECT_BASE_URI = `/services/data/${API_VERSION}`;
const PROPERTIES_TTL = 3600000;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

// getTagsByRecordId
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
    const { recordId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/interest-tags/assignments/entity/${recordId}`,
        queryParams: {},
    });
}

// getInterestTagEntityAssignments (by tagId)
export function mockGetInterestTagEntityAssignmentsNetworkOnce(config, mockData) {
    const paramMatch = getInterestTagEntityAssignmentsMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetInterestTagEntityAssignmentsNetworkErrorOnce(config, mockData) {
    const paramMatch = getInterestTagEntityAssignmentsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetInterestTagEntityAssignmentsNetworkSequence(config, mockData) {
    const paramMatch = getInterestTagEntityAssignmentsMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function expireGetInterestTagEntityAssignments() {
    timekeeper.travel(Date.now() + PROPERTIES_TTL + 1);
}

function getInterestTagEntityAssignmentsMatcher(config) {
    const { tagId } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/interest-tags/assignments/tag/${tagId}`,
        queryParams: {},
    });
}

// getTagsByCategoryId
export function mockGetTagsByCategoryIdNetworkOnce(config, mockData) {
    const paramMatch = getTagsByCategoryIdMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagsByCategoryIdNetworkErrorOnce(config, mockData) {
    const paramMatch = getTagsByCategoryIdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagsByCategoryIdNetworkSequence(config, mockData) {
    const paramMatch = getTagsByCategoryIdMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function expireGetTagsByCategoryId() {
    timekeeper.travel(Date.now() + PROPERTIES_TTL + 1);
}

function getTagsByCategoryIdMatcher(config) {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/interest-tags/tags`,
        queryParams: { ...config },
    });
}

// getTagCategoriesByTagId
export function mockGetTagCategoriesByTagIdNetworkOnce(config, mockData) {
    const paramMatch = getTagCategoriesByTagIdMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagCategoriesByTagIdNetworkErrorOnce(config, mockData) {
    const paramMatch = getTagCategoriesByTagIdMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTagCategoriesByTagIdNetworkSequence(config, mockData) {
    const paramMatch = getTagCategoriesByTagIdMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

export function expireGetTagCategoriesByTagId() {
    timekeeper.travel(Date.now() + PROPERTIES_TTL + 1);
}

function getTagCategoriesByTagIdMatcher(config) {
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/interest-tags/categories`,
        queryParams: { ...config },
    });
}
