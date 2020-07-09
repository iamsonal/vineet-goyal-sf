import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeOffline, makeDurable } from '@ldsjs/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
import { makeDurableRecordAware } from '@salesforce/lds-adapters-uiapi';

const store = new Store();
const durableStore = new NimbusDurableStore();
const env = makeDurableRecordAware(
    makeDurable(makeOffline(new Environment(store, NimbusNetworkAdapter)), durableStore),
    durableStore,
    store
);
const lds = new LDS(env);

export { lds };
