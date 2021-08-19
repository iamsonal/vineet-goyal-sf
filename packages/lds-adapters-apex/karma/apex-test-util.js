'use strict';

import { karmaNetworkAdapter } from 'lds-engine';
import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { mockNetworkOnce, mockNetworkSequence } from 'test-util';

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: hardcode the TTL for now.
// TTL should be imported from generated code, once we can define it on RAML.
const APEX_TTL = 5 * 60 * 1000;

const CACHE_CONTROL = 'Cache-Control';

/**
 * Force a cache expiration for actions by fast-forwarding time past the
 * standard Apex TTL.
 */
function expireApex() {
    timekeeper.travel(Date.now() + APEX_TTL + 1);
}

/**
 * Mock a single successful network request to return a given payload.
 *
 * @param {object} request The Apex network request.
 * @param {object} mockData The data payload to return when the mock is called.
 * @param {array} responseHeaders The headers to return when the mock is called.
 */
function mockApexNetworkOnce(request, mockData, responseHeaders) {
    const matchParams = apexMatcher(request);
    mockNetworkOnce(karmaNetworkAdapter, matchParams, mockData, responseHeaders);
}

/**
 * Mock multiple network requests to return a series of data payloads.
 * It assumes multiple requests are expected when mockData is an array.
 * If the test expects to return one single response as an array, using
 * ```mockApexNetworkOnce``` instead.
 * It can also be used when the test expects a reject network reponse.
 *
 * @param {object} request The Apex network request.
 * @param {array|object} mockData The data payload to return when the mock is called.
 * To reject a network call, provide the data as an object with 'reject' property
 * ```{ reject: true, data: mockData }```.
 * @param {array} responseHeaders The headers to return when the mock is called.
 */
function mockApexNetwork(request, mockData, responseHeaders) {
    const matchParams = apexMatcher(request);

    mockNetworkSequence(
        karmaNetworkAdapter,
        matchParams,
        Array.isArray(mockData) ? mockData : [mockData],
        responseHeaders
    );
}

function apexMatcher(request) {
    // Removing headers from match value, since it doesn't like "X-SFDC-Allow-Continuation"
    const req = { ...request };
    delete req.headers;
    return sinon.match(req);
}

export { CACHE_CONTROL, expireApex, mockApexNetworkOnce, mockApexNetwork };
