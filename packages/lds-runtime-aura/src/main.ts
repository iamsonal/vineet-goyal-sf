import { Luvio, Store, Environment } from '@luvio/engine';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import networkAdapter from '@salesforce/lds-network-aura';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';
import { setupMetadataWatcher } from './metadata';

export default function ldsEngineCreator() {
    const storeOptions = {
        scheduler: () => {},
    };
    const store = new Store(storeOptions);
    const environment = new Environment(store, networkAdapter);
    const luvio = new Luvio(environment, {
        instrument: instrumentation.instrumentNetwork.bind(instrumentation),
    });

    setupInstrumentation(luvio, store);
    setupMetadataWatcher(luvio);

    setDefaultLuvio({ luvio });

    return { name: 'ldsEngineCreator' };
}
