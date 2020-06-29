import { LDS, Store, Environment } from '@ldsjs/engine';

import networkAdapter from '@salesforce/lds-network';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';

const store = new Store();
const environment = new Environment(store, networkAdapter);

const lds = new LDS(environment, {
    instrument: instrumentation.instrumentNetwork.bind(instrumentation),
});

setupInstrumentation(lds, store);

export { lds };
