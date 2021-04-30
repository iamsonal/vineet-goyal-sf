import { Luvio, Store, Environment, IngestPath } from '@luvio/engine';
import { makeOffline, makeDurable } from '@luvio/environments';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';

import {
    RecordRepresentation,
    responseRecordRepresentationRetrievers,
    ingestRecord,
} from '@salesforce/lds-adapters-uiapi';
import { getRecordsPropertyRetriever } from '@salesforce/lds-uiapi-record-utils';
import {
    makeDurableStoreDraftAware,
    makeEnvironmentDraftAware,
    makeNetworkAdapterDraftAware,
    RecordMetadataOnSetPlugin,
    DurableStoreSetEntryPlugin,
    DraftManager,
} from '@salesforce/lds-drafts';

import userId from '@salesforce/user/Id';
import { recordIdGenerator } from './RecordIdGenerator';

import { NimbusNetworkAdapter } from './network/NimbusNetworkAdapter';
import { makeNetworkAdapterBatchRecordFields } from './network/record-field-batching/makeNetworkAdapterBatchRecordFields';
import { NimbusDurableStore } from './NimbusDurableStore';
import { buildLdsDraftQueue } from './DraftQueueFactory';
import { buildInternalAdapters } from './utils/adapters';
import { objectInfoServiceFactory } from './utils/ObjectInfoService';

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

// specific adapters
const { getObjectInfo, getRecord } = buildInternalAdapters(store, networkAdapter, durableStore);
const { ensureObjectInfoCached, apiNameForPrefix, prefixForApiName } = objectInfoServiceFactory(
    getObjectInfo,
    durableStore
);

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

// build the draft durable store plugins
const objectInfoPlugin = new RecordMetadataOnSetPlugin(ensureObjectInfoCached);
const plugins: DurableStoreSetEntryPlugin[] = [objectInfoPlugin];

const draftAwareDurableStore = makeDurableStoreDraftAware(
    durableStore,
    plugins,
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
        compositeRetrievers: [getRecordsPropertyRetriever],
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
        getRecord,
        prefixForApiName,
        apiNameForPrefix,
        recordResponseRetrievers: responseRecordRepresentationRetrievers,
    },
    userId
);

luvio = new Luvio(env);
setDefaultLuvio({ luvio });

export { luvio, draftQueue, draftManager };

/**
 * NB: to exactly match force/ldsEngine, we'd also need to:
 *
 * export { Environment, GraphNode, HttpStatusCode, Luvio, Reader, Store } from '@luvio/engine';
 * export { setDefaultLuvio } from '@salesforce/lds-default-luvio';
 *
 * but those are really only needed for scenarios like force/ldsEngineCreator where the luvio instance
 * is created by a different module.
 */

// so adapter modules can find our luvio instance
export { withDefaultLuvio } from '@salesforce/lds-default-luvio';
