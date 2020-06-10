import { LDS, Store, Environment } from '@ldsjs/engine';

import networkAdapter from '@salesforce/lds-network';
import { Instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';

const store = new Store();
const instrumentation = new Instrumentation();
const environment = new Environment(store, networkAdapter);

const lds = new LDS(environment, {
    instrument: instrumentation.instrumentNetwork.bind(instrumentation),
});

setupInstrumentation(lds, store);

export { lds };
