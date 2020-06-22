import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeOffline, makeDurable } from '@ldsjs/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';

const store = new Store();
const durableStore = new NimbusDurableStore();
const env = makeDurable(makeOffline(new Environment(store, NimbusNetworkAdapter)), durableStore);
const lds = new LDS(env);

export { lds };
