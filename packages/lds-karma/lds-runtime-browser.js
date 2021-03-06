import sinon from 'sinon';
import { Luvio, Store, Environment } from '@luvio/engine';
import { setDefaultLuvio, withDefaultLuvio } from '@salesforce/lds-default-luvio';

import { makeEnvironmentResettable, resetAllAdapterContexts } from './makeEnvironmentResettable';

const karmaNetworkAdapter = sinon.stub().rejects();

const store = new Store();
const luvio = new Luvio(makeEnvironmentResettable(new Environment(store, karmaNetworkAdapter)));

setDefaultLuvio({ luvio });

export { karmaNetworkAdapter, luvio, store, resetAllAdapterContexts, withDefaultLuvio };
