// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const CONNECT_BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockJoinChimeMeetingNetworkOnce(config, mockData) {
    const paramMatch = joinChimeMeetingMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockJoinChimeMeetingNetworkErrorOnce(config, mockData) {
    const paramMatch = joinChimeMeetingMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function joinChimeMeetingMatcher(config) {
    let { externalMeetingId, region } = config;

    return sinon.match({
        body: {
            externalMeetingId,
            region,
        },
        headers: {},
        method: 'post',
        baseUri: CONNECT_BASE_URI,
        basePath: `/connect/health/video-visits/chime-meeting`,
        queryParams: {},
    });
}
