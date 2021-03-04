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

import userId from '@salesforce/user/Id';
import { recordIdGenerator } from './RecordIdGenerator';

import { NimbusNetworkAdapter } from './network/NimbusNetworkAdapter';
import { makeNetworkAdapterBatchRecordFields } from './network/record-field-batching/makeNetworkAdapterBatchRecordFields';
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

const registerDraftMapping = (draftKey: string, canonicalKey: string) => {
    if (luvio !== undefined) {
        luvio.storeRedirect(draftKey, canonicalKey);
        luvio.storeBroadcast();
    }
};

// non-draft-aware base services
const store = new Store();
const durableStore = new NimbusDurableStore();
const networkAdapter = makeNetworkAdapterBatchRecordFields(NimbusNetworkAdapter);

// user id centric record ID generator
const { newRecordId, isGenerated } = recordIdGenerator(userId);

// draft queue
const draftQueue = buildLdsDraftQueue(networkAdapter, durableStore);

// draft manager
const draftManager = new DraftManager(draftQueue);

// make network and durable draft aware
const draftAwareNetworkAdapter = makeNetworkAdapterDraftAware(
    networkAdapter,
    draftQueue,
    responseRecordRepresentationRetrievers,
    userId
);
const draftAwareDurableStore = makeDurableStoreDraftAware(
    durableStore,
    draftQueue,
    store,
    isGenerated,
    registerDraftMapping,
    userId
);

// build environment
const env = makeEnvironmentDraftAware(
    makeDurable(makeOffline(new Environment(store, draftAwareNetworkAdapter)), {
        durableStore: draftAwareDurableStore,
        reviveRetrievers: responseRecordRepresentationRetrievers,
    }),
    {
        store,
        draftQueue,
        // W-8794366: replace with draftAwareDurableStore once resolved
        // draftAwareDurableStore,
        durableStore,
        ingestFunc: recordIngestFunc,
        generateId: newRecordId,
        isDraftId: isGenerated,
        recordResponseRetrievers: responseRecordRepresentationRetrievers,
    },
    userId
);

luvio = new Luvio(env);

export { luvio, draftQueue, draftManager };
