import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeOffline, makeDurable } from '@ldsjs/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
import { responseRecordRepresentationRetrievers } from '@salesforce/lds-adapters-uiapi';
import { makeDurableStoreRecordAware } from './makeDurableStoreRecordAware';

const store = new Store();
const durableStore = makeDurableStoreRecordAware(new NimbusDurableStore(), store);
const env = makeDurable(
    makeOffline(new Environment(store, NimbusNetworkAdapter)),
    durableStore,
    responseRecordRepresentationRetrievers
);
const lds = new LDS(env);

export { lds };
