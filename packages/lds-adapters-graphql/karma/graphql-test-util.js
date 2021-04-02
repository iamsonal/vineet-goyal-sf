'use strict';

import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence } from 'test-util';

const API_VERSION = 'v52.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/graphql`;

const RECORD_TTL = 30000;

function mockGraphqlNetwork(config, mockData) {
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}`,
        method: 'post',
        body: config,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordNetwork(config, mockData) {
    const { recordId, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records/${recordId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function expireRecords() {
    timekeeper.travel(Date.now() + RECORD_TTL + 1);
}

export {
    // network mock utils
    mockGraphqlNetwork,
    mockGetRecordNetwork,
    expireRecords,
};
