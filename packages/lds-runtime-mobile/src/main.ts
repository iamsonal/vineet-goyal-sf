import { Luvio, Store, Environment, IngestPath } from '@luvio/engine';
import { makeOffline, makeDurable } from '@luvio/environments';

import {
    RecordRepresentation,
    responseRecordRepresentationRetrievers,
    ingestRecord,
} from '@salesforce/lds-adapters-uiapi';
import {
    makeDurableStoreDraftAware,
    makeEnvironmentDraftAware,
    makeNetworkAdapterDraftAware,
    DraftManager,
} from '@salesforce/lds-drafts';

import Id from '@salesforce/user/Id';
import { recordIdGenerator } from '@mobileplatform/record-id-generator';

import { NimbusNetworkAdapter } from './NimbusNetworkAdapter';
import { NimbusDurableStore } from './NimbusDurableStore';
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

// user id centric record ID generator
const { newRecordId, isGenerated } = recordIdGenerator(Id);

// draft queue
const draftQueue = buildLdsDraftQueue(networkAdapter, durableStore);

// draft manager
const draftManager = new DraftManager(draftQueue);

// make network and durable draft aware
const draftAwareNetworkAdapter = makeNetworkAdapterDraftAware(
    networkAdapter,
    draftQueue,
    responseRecordRepresentationRetrievers
);
const draftAwareDurableStore = makeDurableStoreDraftAware(
    durableStore,
    draftQueue,
    store,
    isGenerated
);

// build environment
const env = makeEnvironmentDraftAware(
    makeDurable(
        makeOffline(new Environment(store, draftAwareNetworkAdapter)),
        draftAwareDurableStore,
        responseRecordRepresentationRetrievers
    ),
    store,
    draftQueue,
    draftAwareDurableStore,
    recordIngestFunc,
    newRecordId,
    isGenerated,
    responseRecordRepresentationRetrievers
);

luvio = new Luvio(env);

export { luvio, draftQueue, draftManager };
