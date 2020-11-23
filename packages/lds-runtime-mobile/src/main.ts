import { Luvio, Store, Environment, IngestPath, NetworkAdapter } from '@luvio/engine';
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

let lds: Luvio;

// TODO - W-8291468 - have ingest get called a different way somehow
const recordIngestFunc = (
    record: RecordRepresentation,
    path: IngestPath,
    store: Store,
    timeStamp: number
) => {
    if (lds !== undefined) {
        ingestRecord(record, path, lds, store, timeStamp);
    }
};

// non-draft-aware base services
const store = new Store();
const durableStore = new NimbusDurableStore();
const networkAdapter = NimbusNetworkAdapter;

// draft queue
let draftAwareNetworkAdapter: NetworkAdapter;
const draftQueue = buildLdsDraftQueue(request => draftAwareNetworkAdapter(request), durableStore);

// make network and durable draft aware
draftAwareNetworkAdapter = makeNetworkAdapterDraftAware(
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
    recordIngestFunc
);

lds = new Luvio(env);

export { lds, draftQueue };
