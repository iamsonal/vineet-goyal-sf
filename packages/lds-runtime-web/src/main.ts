import { Luvio, Store, Environment } from '@luvio/engine';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import networkAdapter from '@salesforce/lds-network';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';

export function createLuvio() {
    const store = new Store();
    const environment = new Environment(store, networkAdapter);

    const luvio = new Luvio(environment, {
        instrument: instrumentation.instrumentNetwork.bind(instrumentation),
    });

    setupInstrumentation(luvio, store);

    setDefaultLuvio({ luvio });
    return luvio;
}
