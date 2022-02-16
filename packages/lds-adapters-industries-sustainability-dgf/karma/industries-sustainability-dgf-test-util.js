import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function mockDgfDateIssueNetworkOnce(config, mockData) {
    const paramMatch = dgfDateIssueMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockDgfDateIssueNetworkErrorOnce(config, mockData) {
    const paramMatch = dgfDateIssueMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function dgfDateIssueMatcher(config) {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/dgf/identify-date-issues`,
        method: 'post',
        body: { ...config },
    });
}

export function mockDgfDataGapFillerNetworkOnce(config, mockData) {
    const paramMatch = dataGapFillerMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockDgfDataGapFillerNetworkErrorOnce(config, mockData) {
    const paramMatch = dataGapFillerMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function dataGapFillerMatcher(config) {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/sustainability/dgf/compute-datagap-fillers`,
        method: 'post',
        body: { ...config },
    });
}
