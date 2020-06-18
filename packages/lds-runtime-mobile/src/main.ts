import { LDS, Store, Environment } from '@ldsjs/engine';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';

const store = new Store();
const env = new Environment(store, NimbusNetworkAdapter);
const lds = new LDS(env);

export { lds };
