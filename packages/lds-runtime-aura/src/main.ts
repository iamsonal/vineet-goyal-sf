import { Luvio, Store, Environment } from '@luvio/engine';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import networkAdapter from '@salesforce/lds-network-aura';
import { instrumentation, setupInstrumentation } from '@salesforce/lds-instrumentation';
import { setupMetadataWatcher } from './metadata';
import ldsTrackedFieldsBehaviorGate from '@salesforce/gate/lds.useNewTrackedFieldBehavior';
import {
    setTrackedFieldLeafNodeIdOnly,
    setTrackedFieldDepthOnNotifyChange,
    setTrackedFieldDepthOnCacheMergeConflict,
    setTrackedFieldDepthOnCacheMiss,
} from '@salesforce/lds-adapters-uiapi';

function setTrackedFieldsConfig(includeLeafNodeIdOnly: boolean): void {
    const depth = includeLeafNodeIdOnly ? 1 : 5;

    setTrackedFieldLeafNodeIdOnly(includeLeafNodeIdOnly);
    setTrackedFieldDepthOnCacheMiss(depth);
    setTrackedFieldDepthOnCacheMergeConflict(depth);
    setTrackedFieldDepthOnNotifyChange(depth);
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
