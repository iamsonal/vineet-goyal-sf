import { LDS, Store, Environment, makeOffline } from '@ldsjs/engine';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';

const store = new Store();
const env = makeOffline(new Environment(store, NimbusNetworkAdapter));
const lds = new LDS(env);

export { lds };
