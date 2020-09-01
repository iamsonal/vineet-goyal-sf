import sinon from 'sinon';
import { LDS, Store, Environment } from '@ldsjs/engine';

import { makeEnvironmentResettable, resetAllAdapterContexts } from './makeEnvironmentResettable';

const karmaNetworkAdapter = sinon.stub().rejects();

const store = new Store();
const lds = new LDS(makeEnvironmentResettable(new Environment(store, karmaNetworkAdapter)));

export { karmaNetworkAdapter, lds, store, resetAllAdapterContexts };
