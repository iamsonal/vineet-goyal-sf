import { Environment, Luvio, Store, NetworkAdapter } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import {
    getRecordAdapterFactory,
    getObjectInfoAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';

/**
Builds adapter instances for environments that have cross-adapter dependencies.
These are only to be used internally in this module and not exported.
They do not use draft environments, just the makeDurable environment.
*/
export function buildInternalAdapters(
    store: Store,
    networkAdapter: NetworkAdapter,
    durableStore: DurableStore
) {
    const durableEnvironment = makeDurable(new Environment(store, networkAdapter), {
        durableStore,
    });
    const luvio = new Luvio(durableEnvironment);
    const getRecord = getRecordAdapterFactory(luvio);
    const getObjectInfo = getObjectInfoAdapterFactory(luvio);

    return {
        luvio,
        durableEnvironment,
        adapters: {
            getRecord,
            getObjectInfo,
        },
    };
}
