import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeOffline, makeDurable } from '@ldsjs/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
import { responseRecordRepresentationRetrievers } from '@salesforce/lds-adapters-uiapi';

const store = new Store();
const durableStore = new NimbusDurableStore();

const env = makeDurable(
    makeOffline(new Environment(store, NimbusNetworkAdapter)),
    durableStore,
    responseRecordRepresentationRetrievers
);

const lds = new LDS(env);

export { lds };
