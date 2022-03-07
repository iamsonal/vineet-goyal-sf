import type { NetworkAdapter } from '@luvio/engine';
import { Environment, Luvio, Store } from '@luvio/engine';

/**
 * Parameters accepted by setDefaultLuvio.
 */
export type SetDefaultLuvioParameters =
    | {
          // use this Luvio instance as the default
          luvio: Luvio;
      }
    | {
          // construct & use a new Luvio instance that uses this Environment
          environment: Environment;
      }
    | {
          // construct & use a new luvio that uses this Store and NetworkAdapter; if Store is
          // omitted, use the default Store implementation
          store?: Store;
          networkAdapter: NetworkAdapter;
      };

/**
 * Callback used to inform interested parties that a new default Luvio has been set.
 */
export type Callback = (luvio: Luvio) => void;

// most recently set default Luvio instance
let defaultLuvio: Luvio;

// callbacks to be invoked when default luvio instance is set/changed
let callbacks: Callback[] = [];

/**
 * Constructs/sets the default Luvio instance. Any previously-set default luvio instance
 * is overwritten.
 */
export function setDefaultLuvio(params: SetDefaultLuvioParameters) {
    const newLuvio =
        'luvio' in params
            ? params.luvio
            : 'environment' in params
            ? new Luvio(params.environment)
            : 'networkAdapter' in params
            ? new Luvio(new Environment(params.store || new Store(), params.networkAdapter))
            : undefined;

    if (newLuvio === undefined) {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('unable to construct default Luvio instance from supplied parameters');
    }

    defaultLuvio = newLuvio;

    // inform observers
    for (let i = 0; i < callbacks.length; ++i) {
        callbacks[i](defaultLuvio);
    }
}

/**
 * Registers a callback to be invoked with the default Luvio instance. Note that the
 * callback may be invoked multiple times if the default Luvio changes.
 *
 * @param callback callback to be invoked with default Luvio instance
 */
export function withDefaultLuvio(callback: Callback) {
    if (defaultLuvio) {
        callback(defaultLuvio);
    }

    callbacks.push(callback);
}
