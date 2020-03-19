'use strict';

import { karmaNetworkAdapter } from 'lds';
import {
    clearCache,
    flushPromises,
    skipPromiseForNetworkResponse,
    countNetworkCalls,
} from 'impl-test-utils';
import { createElement } from 'lwc';
import timekeeper from 'timekeeper';

const FETCH_RESPONSE_OK = {
    status: 200,
    statusText: 'Ok',
    ok: true,
};

const FETCH_RESPONSE_ERROR = {
    status: 500,
    statusText: 'Server Error',
    ok: false,
};

let MOCK_NETWORK_COUNT = 0;
let MOCK_NETWORK_CALLS = 0;

/**
 * Clone a JSON data payload.
 *
 * @param {object} data The data to clone
 * @returns {object} The cloned data in JSON format
 */
function clone(data) {
    return JSON.parse(JSON.stringify(data));
}

/**
 * Returns the mock of an API response.
 *
 * @param {string} path Path to file relative to the basePath set in the Karma config file
 * @returns {object} The parsed JSON file
 */
function getMock(path) {
    const mock = __mockData__[path];
    return JSON.parse(JSON.stringify(mock));
}

/**
 * Strips the eTag entry from a data payload. Useful to comparing data payloads
 * where eTag may not be present in the data send down through the wire.
 *
 * @param {object} obj The JSON payload to strip eTag from
 * @returns {object} The payload in JSON format
 */
function stripEtags(obj) {
    return stripProperties(obj, ['eTag', 'weakEtag']);
}

/**
 * Strips the given properties from a data payload. Useful to comparing data payloads
 * where the properties may not be present in the data send down through the wire.
 *
 * @param {object} obj The JSON payload to strip properties from
 * @param {string[]} props The properties to be removed from the payload
 * @returns {object} The payload in JSON format
 */
function stripProperties(obj, props) {
    props.forEach(prop => {
        delete obj[prop];
    });

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            stripProperties(value, props);
        }
    });
    return obj;
}

/**
 * Mock a network request to return a series of data payloads. If the network
 * mock is hit more times than the number of responses provided, an error is
 * thrown. If the network mock is hit less times than the number of responses,
 * the assertNetworkCallCount() call will fail the test.
 *
 * @param {object} adapter The network adapter LDS uses to make server-side
 * requests. Assumes this is a sinon stub.
 * @param {object} args Arguments the network adapter is called with to match
 * @param {object} responses The data payloads to return when the mock is called.
 * To reject a network call, provide the data as an object with 'reject' property
 * ```{ reject: true, data: mockData }```.
 * @param {object[]} headers The headers to return when the mock is called
 */
function mockNetworkSequence(adapter, args, responses, headers = []) {
    const times = responses.length;
    MOCK_NETWORK_COUNT += times;

    responses.forEach((response, index) => {
        adapter
            .withArgs(args)
            .onCall(index)
            .callsFake(function() {
                MOCK_NETWORK_CALLS += 1;

                const header = headers[index] ? clone(headers[index]) : null;
                if (response.reject) {
                    const rejectResult = {
                        ...FETCH_RESPONSE_ERROR,
                        status: response.status || FETCH_RESPONSE_ERROR.status,
                        statusText: response.statusText || FETCH_RESPONSE_ERROR.statusText,
                        ok: response.ok !== undefined ? response.ok : FETCH_RESPONSE_ERROR.ok,
                        body: clone(response.data),
                        ...(header && { headers: header }),
                    };

                    // TODO - remove this once https://github.com/salesforce/nimbus/issues/98
                    // is fixed and just have it return a promise
                    return skipPromiseForNetworkResponse === true
                        ? rejectResult
                        : Promise.reject(rejectResult);
                }

                const resolveResponse = {
                    ...FETCH_RESPONSE_OK,
                    body: clone(response),
                    ...(header && { headers: header }),
                };

                // TODO - remove this once https://github.com/salesforce/nimbus/issues/98
                // is fixed and just have it return a promise
                return skipPromiseForNetworkResponse === true
                    ? resolveResponse
                    : Promise.resolve(resolveResponse);
            });
    });

    adapter.throws(`Network adapter stub called more than ${times} time(s)`);
}

/**
 * Mock a single network request to return an error response. If the network
 * mock is hit a second time an error is thrown. If the network mock is never
 * hit, the assertNetworkCallCount() call will fail the test.
 *
 * @param {object} adapter The network adapter LDS uses to make server-side
 * requests. Assumes this is a sinon stub.
 * @param {object} args Arguments the network adapter is called with to match
 * @param {object} response The data payload to return when the mock is called
 * @param {object} headers The headers to return when the mock is called
 */
function mockNetworkErrorOnce(adapter, args, response, headers) {
    mockNetworkOnce(adapter, args, { reject: true, data: response }, headers);
}

/**
 * Mock a single network request to return a given payload. If the network
 * mock is hit a second time an error is thrown. If the network mock is never
 * hit, the assertNetworkCallCount() call will fail the test.
 *
 * @param {object} adapter The network adapter LDS uses to make server-side
 * requests. Assumes this is a sinon stub.
 * @param {object} args Arguments the network adapter is called with to match
 * @param {object} response The data payload to return when the mock is called
 * @param {object} headers The headers to return when the mock is called
 */
function mockNetworkOnce(adapter, args, response, headers) {
    mockNetworkSequence(adapter, args, [response], [headers]);
}

/**
 * Assert the number of network requests matches the number of mocks setup
 * during the test. Fails the test if there is a mismatch.
 */
function assertNetworkCallCount() {
    // TODO - W-7095524 - tests will get broken out into shared functional tests
    // (that don't test implementation details like network calls) and implementation
    // specific tests (that count network calls), so this "countNetworkCalls" flag
    // will get reworked then.
    if (countNetworkCalls) {
        if (MOCK_NETWORK_COUNT !== MOCK_NETWORK_CALLS) {
            fail(
                `Unexpected number of network calls. Expected ${MOCK_NETWORK_COUNT}, got ${MOCK_NETWORK_CALLS}.`
            );
        }

        MOCK_NETWORK_COUNT = MOCK_NETWORK_CALLS = 0;
    }
}

/**
 * Create a Lightning web component and push it to the DOM after setting the
 * given properties on the component. Returns a resolved promise to allow the
 * component to fully instantiate and render.
 *
 * @param {object} props Properties to set on the created LWC element
 * @param {object} elementType The LWC element object to create
 * @returns {Promise<LWC>} A resolved promise that resolves to the newly
 * created LWC element that has been pushed to the DOM
 */
function setupElement(props, elementType) {
    const element = createElement('x-foo', { is: elementType });
    Object.assign(element, props);
    document.body.appendChild(element);
    return flushPromises().then(() => {
        return element;
    });
}

function updateElement(element, props) {
    Object.assign(element, props);
    return flushPromises();
}

function verifyMutationThrows(predicate) {
    try {
        predicate();
    } catch (e) {
        return true;
    }
    return false;
}

function verifyImmutable(value, path) {
    if (typeof value !== 'object' || value === null) {
        return;
    }
    if (Array.isArray(value)) {
        if (
            verifyMutationThrows(() => {
                const len = value.length;
                value.push('__test');
                if (len === value.length) {
                    throw new Error('IE11 does not throw when mutating a frozen object');
                }
            }) === false
        ) {
            throw new Error(`Unexpected mutable property found at ${path}: Array is extensible!`);
        }

        value.forEach((item, index) => {
            verifyImmutable(item, `${path}.${index}`);
        });
        return;
    }

    if (
        verifyMutationThrows(() => {
            value['__test_____'] = true;
            if (value['__test_____'] !== true) {
                throw new Error('IE11 does not throw when mutating a frozen object');
            }
        }) === false
    ) {
        throw new Error(`Unexpected mutable property found at ${path}: Object is extensible!`);
    }

    Object.keys(value).forEach(key => {
        if (
            verifyMutationThrows(() => {
                const old = value[key];
                value[key] = '_______foo';
                if (value[key] === old) {
                    throw new Error('IE11 does not throw when mutating a frozen object');
                }
            }) === false
        ) {
            throw new Error(
                `Unexpected mutable property found at ${path}: "${path}.${key}" is mutable!`
            );
        }
        verifyImmutable(value[key], `${path}.${key}`);
    });
}

function verifyMutable(value, path) {
    return !verifyMutationThrows(() => {
        verifyImmutable(value, path);
    });
}

function removeElement(element) {
    const oldChild = document.body.removeChild(element);
    return flushPromises().then(() => {
        return oldChild;
    });
}

function resetNetworkStub() {
    karmaNetworkAdapter.reset();
}

function resetTime() {
    timekeeper.reset();
}

export {
    FETCH_RESPONSE_OK,
    FETCH_RESPONSE_ERROR,
    assertNetworkCallCount,
    clearCache,
    clone,
    flushPromises,
    getMock,
    mockNetworkErrorOnce,
    mockNetworkOnce,
    mockNetworkSequence,
    stripEtags,
    stripProperties,
    setupElement,
    resetNetworkStub,
    resetTime,
    removeElement,
    updateElement,
    verifyImmutable,
    verifyMutable,
};
