'use strict';

import { karmaNetworkAdapter } from 'lds';
import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { mockNetworkOnce, mockNetworkSequence } from 'test-util';

// TODO: hardcode the TTL for now.
// TTL should be imported from generated code, once we can define it on RAML.
const APEX_TTL = 5 * 60 * 1000;

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
 * @param {object} body The 'body' property of Apex network request.
 * @param {object} mockData The data payload to return when the mock is called.
 * @param {array} responseHeaders The headers to return when the mock is called.
 */
function mockApexNetworkOnce(body, mockData, responseHeaders) {
    const matchParams = sinon.match({
        basePath: '/apex',
        method: 'post',
        body: { ...body },
        headers: {},
    });

    mockNetworkOnce(karmaNetworkAdapter, matchParams, mockData, responseHeaders);
}

/**
 * Mock multiple network requests to return a series of data payloads.
 * It assumes multiple requests are expected when mockData is an array.
 * If the test expects to return one single response as an array, using
 * ```mockApexNetworkOnce``` instead.
 * It can also be used when the test expects a reject network reponse.
 *
 * @param {object} body The 'body' property of Apex network request.
 * @param {array|object} mockData The data payload to return when the mock is called.
 * To reject a network call, provide the data as an object with 'reject' property
 * ```{ reject: true, data: mockData }```.
 * @param {array} responseHeaders The headers to return when the mock is called.
 */
function mockApexNetwork(body, mockData, responseHeaders) {
    const matchParams = sinon.match({
        basePath: '/apex',
        method: 'post',
        body: { ...body },
        headers: {},
    });

    mockNetworkSequence(
        karmaNetworkAdapter,
        matchParams,
        Array.isArray(mockData) ? mockData : [mockData],
        responseHeaders
    );
}

export { expireApex, mockApexNetworkOnce, mockApexNetwork };
