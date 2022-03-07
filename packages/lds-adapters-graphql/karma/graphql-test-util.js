'use strict';

import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence, mockNetworkErrorOnce } from 'test-util';
import { parse, print } from 'graphql';

import { parseAndVisit } from '@luvio/graphql-parser';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/graphql`;

const RECORD_TTL = 30000;

function getParamMatch(config) {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}`,
        method: 'post',
        body: {
            ...config,
            query: sinon.match((actual) => {
                return prettifyGraphQL(config.query) === prettifyGraphQL(actual);
            }),
        },
    });
}

function mockGraphqlNetwork(config, mockData) {
    const paramMatch = getParamMatch(config);

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGraphqlNetworkErrorOnce(config, mockErrorData) {
    const paramMatch = getParamMatch(config);

    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockErrorData);
}

function mockGetRecordNetwork(config, mockData) {
    const { recordId, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `/ui-api/records/${recordId}`,
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

function parseQuery(query) {
    return parseAndVisit(query);
}

function prettifyGraphQL(query) {
    return print(parse(query));
}

export {
    // network mock utils
    mockGraphqlNetwork,
    mockGraphqlNetworkErrorOnce,
    mockGetRecordNetwork,
    expireRecords,
    parseQuery,
    prettifyGraphQL,
};
