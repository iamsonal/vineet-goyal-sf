import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeOffline, makeDurable } from '@ldsjs/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
import { responseRecordRepresentationRetrievers } from '@salesforce/lds-adapters-uiapi';
import {
    makeDurableStoreDraftAware,
    makeEnvironmentDraftAware,
    makeNetworkAdapterDraftAware,
} from '@salesforce/lds-drafts';
import { configureLdsDraftQueue } from './DraftQueueFactory';

let lds: LDS;

// non-draft-aware base services
const store = new Store();
const durableStore = new NimbusDurableStore();
const networkAdapter = NimbusNetworkAdapter;

// draft queue
const draftQueue = configureLdsDraftQueue(networkAdapter, durableStore, () => lds, store);

// make network and durable draft aware
const draftAwareNetworkAdapter = makeNetworkAdapterDraftAware(
    networkAdapter,
    draftQueue,
    responseRecordRepresentationRetrievers
);
const draftAwareDurableStore = makeDurableStoreDraftAware(durableStore, draftQueue, store);

// build environment
const env = makeEnvironmentDraftAware(
    makeDurable(
        makeOffline(new Environment(store, draftAwareNetworkAdapter)),
        draftAwareDurableStore,
        responseRecordRepresentationRetrievers
    ),
    store,
    draftQueue
);

lds = new LDS(env);

export { lds, draftQueue };
