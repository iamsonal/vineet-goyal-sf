'use strict';

import { hasPendingNativeCalls } from 'lds';

async function flushNativeCalls(timeout = 5000, loopInterval = 250) {
    let counter = timeout;
    while (hasPendingNativeCalls() && counter > 0) {
        await new Promise(r => setTimeout(r, loopInterval));
        counter -= loopInterval;
    }
}

// the default flush promises for browser just waits for the microtask queue to clear
// but lds native has to wait for all native callbacks to return
async function flushPromises() {
    // flush any pending promises
    await new Promise(resolve => setTimeout(resolve));

    // flush any pending native calls
    await flushNativeCalls();
}

/**
 * Clears the cache for the given implementation.
 *
 * @returns {void}
 */
function clearCache() {
    // TODO - call over to native to clear the store
}

// TODO - remove this once https://github.com/salesforce/nimbus/issues/98 is fixed
const skipPromiseForNetworkResponse = true;

// TODO - W-7095524 - remove this flag once tests are broken out b/t shared and impl-specific
const countNetworkCalls = false;

export { clearCache, flushPromises, skipPromiseForNetworkResponse, countNetworkCalls };
