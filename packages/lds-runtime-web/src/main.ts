import { Luvio, Store, Environment } from '@luvio/engine';

import networkAdapter from '@salesforce/lds-network';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';

const store = new Store();
const environment = new Environment(store, networkAdapter);

const luvio = new Luvio(environment, {
    instrument: instrumentation.instrumentNetwork.bind(instrumentation),
});

setupInstrumentation(luvio, store);

export { luvio as lds };
