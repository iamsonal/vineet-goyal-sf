import { Environment, Luvio, Store } from '@luvio/engine';
import ldsTrackedFieldsBehaviorGate from '@salesforce/gate/lds.useNewTrackedFieldBehavior';
import { configuration as ldsAdaptersUiapiConfig } from '@salesforce/lds-adapters-uiapi';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';
import networkAdapter from '@salesforce/lds-network-aura';
import { setupMetadataWatcher } from './metadata';

function setTrackedFieldsConfig(includeLeafNodeIdOnly: boolean): void {
    const depth = includeLeafNodeIdOnly ? 1 : 5;

    ldsAdaptersUiapiConfig.setTrackedFieldLeafNodeIdOnly(includeLeafNodeIdOnly);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnCacheMiss(depth);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnCacheMergeConflict(depth);
    ldsAdaptersUiapiConfig.setTrackedFieldDepthOnNotifyChange(depth);
}

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

    setTrackedFieldsConfig(ldsTrackedFieldsBehaviorGate.isOpen({ fallback: false }));

    return { name: 'ldsEngineCreator' };
}
