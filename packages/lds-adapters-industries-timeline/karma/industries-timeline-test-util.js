import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';
import timekeeper from 'timekeeper';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect`;
const TIMELINE_DATA_TTL = 3600000;

function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

function mockGetTimelineDataNetworkOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetTimelineDataNetworkErrorOnce(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetTimelineDataNetworkSequence(config, mockData) {
    const paramMatch = getMatcher(config);
    mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
}

/**
 * Force a cache expiration for timeline events by fast-forwarding time past the
 * timeline TTL
 */
function expireGetTimelineData() {
    timekeeper.travel(Date.now() + TIMELINE_DATA_TTL + 1);
}

function getMatcher(config) {
    let { timelineObjRecordId, timelineConfigFullName, queryParams } = config;
    return sinon.match({
        body: null,
        headers: {},
        method: 'get',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/timeline/${timelineObjRecordId}/timeline-definitions/${timelineConfigFullName}/events`,
        queryParams: queryParams,
    });
}

export {
    mockGetTimelineDataNetworkOnce,
    mockGetTimelineDataNetworkErrorOnce,
    expireGetTimelineData,
    clone,
    mockGetTimelineDataNetworkSequence,
};
