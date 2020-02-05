'use strict';

import { store } from 'lds';

/**
 * Wait for the microtask queue to clear. This is helpful when LWC needs to
 * finish rerendering after a state change.
 */
function flushPromises() {
    return new Promise(resolve => setTimeout(resolve));
}

/**
 * Clears the cache for the given implementation.
 *
 * @returns {void}
 */
function clearCache() {
    store.reset();
}

// TODO - W-7095524 - remove this flag once tests are broken out b/t shared and impl-specific
const countNetworkCalls = true;

export { clearCache, flushPromises, countNetworkCalls };
