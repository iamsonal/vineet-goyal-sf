import { Environment, Luvio, Store } from '@luvio/engine';
import ldsTrackedFieldsBehaviorGate from '@salesforce/gate/lds.useNewTrackedFieldBehavior';
import { configuration as ldsAdaptersUiapiConfig } from '@salesforce/lds-adapters-uiapi';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import { setupInstrumentation, instrumentation } from './aura-instrumentation/main';
import networkAdapter from '@salesforce/lds-network-aura';
import { setupMetadataWatcher } from './metadata';

function setTrackedFieldsConfig(includeLeafNodeIdOnly: boolean): void {
    const depth = includeLeafNodeIdOnly ? 1 : 5;

    ldsAdaptersUiapiConfig.setTrackedFieldLeafNodeIdOnly(includeLeafNodeIdOnly);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnCacheMiss(depth);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnCacheMergeConflict(depth);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnNotifyChange(depth);
}

// LDS initialization logic, invoked directly by Aura component tests
export function initializeLDS() {
    const storeOptions = {
        scheduler: () => {},
    };
    const store = new Store(storeOptions);
    const environment = new Environment(store, networkAdapter);
    const luvio = new Luvio(environment, {
        instrument: instrumentation.instrumentLuvio.bind(instrumentation),
    });

    setupInstrumentation(luvio, store);

    setupMetadataWatcher(luvio);

    setDefaultLuvio({ luvio });

    setTrackedFieldsConfig(ldsTrackedFieldsBehaviorGate.isOpen({ fallback: false }));
}

// service function to be invoked by Aura
function ldsEngineCreator() {
    initializeLDS();
    return { name: 'ldsEngineCreator' };
}

export default ldsEngineCreator;
