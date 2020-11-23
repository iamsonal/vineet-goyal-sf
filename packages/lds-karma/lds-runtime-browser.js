import sinon from 'sinon';
import { Luvio, Store, Environment } from '@luvio/engine';

import { makeEnvironmentResettable, resetAllAdapterContexts } from './makeEnvironmentResettable';

const karmaNetworkAdapter = sinon.stub().rejects();

const store = new Store();
const lds = new Luvio(makeEnvironmentResettable(new Environment(store, karmaNetworkAdapter)));

export { karmaNetworkAdapter, lds, store, resetAllAdapterContexts };
