import type { Luvio } from '@luvio/engine';
import AdsBridge from './ads-bridge';

import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

/**
 * Callback used to inform interested parties that a new default Luvio has been set.
 */
export type Callback = (adsBridge: AdsBridge) => void;

// most recently created AdsBridge
let adsBridge: AdsBridge;

// callbacks to be invoked when AdsBridge is set/changed
let callbacks: Callback[] = [];

// create a new AdsBridge whenever the default Luvio is set/changed
withDefaultLuvio((luvio: Luvio) => {
    adsBridge = new AdsBridge(luvio);

    for (let i = 0; i < callbacks.length; ++i) {
        callbacks[i](adsBridge);
    }
});

/**
 * Registers a callback to be invoked with the AdsBridge instance. Note that the
 * callback may be invoked multiple times if the default Luvio changes.
 *
 * @param callback callback to be invoked with the AdsBridge
 */
export function withAdsBridge(callback: Callback) {
    if (adsBridge) {
        callback(adsBridge);
    }
    callbacks.push(callback);
}

// Expose module instrumentation
export { instrument, AdsBridgeInstrumentation } from './instrumentation';
