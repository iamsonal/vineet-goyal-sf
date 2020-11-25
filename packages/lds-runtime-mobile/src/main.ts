import { Luvio, Store, Environment, IngestPath } from '@luvio/engine';
import { makeOffline, makeDurable } from '@luvio/environments';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
import {
    RecordRepresentation,
    responseRecordRepresentationRetrievers,
    ingestRecord,
} from '@salesforce/lds-adapters-uiapi';
import {
    makeDurableStoreDraftAware,
    makeEnvironmentDraftAware,
    makeNetworkAdapterDraftAware,
} from '@salesforce/lds-drafts';
import { buildLdsDraftQueue } from './DraftQueueFactory';

let luvio: Luvio;

// TODO - W-8291468 - have ingest get called a different way somehow
const recordIngestFunc = (
    record: RecordRepresentation,
    path: IngestPath,
    store: Store,
    timeStamp: number
) => {
    if (luvio !== undefined) {
        ingestRecord(record, path, luvio, store, timeStamp);
    }
};

// non-draft-aware base services
const store = new Store();
const durableStore = new NimbusDurableStore();
const networkAdapter = NimbusNetworkAdapter;

// draft queue
const draftQueue = buildLdsDraftQueue(networkAdapter, durableStore);

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
    draftQueue,
    recordIngestFunc,
    responseRecordRepresentationRetrievers
);

luvio = new Luvio(env);

export { luvio as lds, draftQueue };
