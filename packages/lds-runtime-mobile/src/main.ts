import { Luvio, Store, Environment } from '@luvio/engine';
import { makeOffline, makeDurable } from '@luvio/environments';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';

import {
    RecordRepresentation,
    ingestRecord,
    keyBuilderRecord,
} from '@salesforce/lds-adapters-uiapi';
import { getRecordsPropertyRetriever } from '@salesforce/lds-uiapi-record-utils';
import {
    makeDurableStoreDraftAware,
    makeRecordDenormalizingDurableStore,
    makeEnvironmentDraftAware,
    DraftManager,
} from '@salesforce/lds-drafts';

import userId from '@salesforce/user/Id';
import { recordIdGenerator } from './RecordIdGenerator';

import { NimbusNetworkAdapter } from './network/NimbusNetworkAdapter';
import { makeNetworkAdapterChunkRecordFields } from './network/record-field-batching/makeNetworkAdapterChunkRecordFields';
import { NimbusDurableStore } from './NimbusDurableStore';
import { buildLdsDraftQueue } from './DraftQueueFactory';
import { buildInternalAdapters } from './utils/adapters';
import { objectInfoServiceFactory } from './utils/ObjectInfoService';
import { RecordMetadataOnSetPlugin } from './durableStore/plugins/RecordMetadataOnSetPlugin';
import { makePluginEnabledDurableStore } from './durableStore/makePluginEnabledDurableStore';
import { makeDurableStoreWithMergeStrategy } from './durableStore/makeDurableStoreWithMergeStrategy';
import { RecordMergeStrategy } from './durableStore/RecordMergeStrategy';

let luvio: Luvio;

// TODO - W-8291468 - have ingest get called a different way somehow
const recordIngestFunc = (record: RecordRepresentation) => {
    if (luvio !== undefined) {
        const key = keyBuilderRecord({ recordId: record.id });
        luvio.storeIngest(key, ingestRecord, record);
    }
};

const registerDraftMapping = (draftKey: string, canonicalKey: string) => {
    if (luvio !== undefined) {
        luvio.storeRedirect(draftKey, canonicalKey);
        luvio.storeBroadcast();
    }
};

const getDraftActionForRecordKeys = (keys: string[]) => {
    const objectSet: { [key: string]: true } = {};
    for (let i = 0, len = keys.length; i < len; i++) {
        objectSet[keys[i]] = true;
    }

    return draftQueue.getActionsForTags(objectSet);
};

// user id centric record ID generator
const { newRecordId, isGenerated } = recordIdGenerator(userId);

// non-draft-aware base services
// TODO: use default scheduler
const storeOptions = {
    scheduler: () => {},
};
const store = new Store(storeOptions);
const networkAdapter = makeNetworkAdapterChunkRecordFields(NimbusNetworkAdapter);

const baseDurableStore = makeDurableStoreWithMergeStrategy(new NimbusDurableStore());

// specific adapters
const internalAdapterStore = new Store();
const internalAdapterDurableStore = makeRecordDenormalizingDurableStore(
    baseDurableStore,
    internalAdapterStore
);
const { getObjectInfo, getRecord } = buildInternalAdapters(
    internalAdapterStore,
    networkAdapter,
    internalAdapterDurableStore
);
const { ensureObjectInfoCached, apiNameForPrefix, prefixForApiName } = objectInfoServiceFactory(
    getObjectInfo,
    internalAdapterDurableStore
);

// creates a durable store that updates records when drafts are inserted
const draftAwareDurableStore = makeDurableStoreDraftAware(
    baseDurableStore,
    getDraftActionForRecordKeys,
    userId
);

// draft queue
const draftQueue = buildLdsDraftQueue(networkAdapter, draftAwareDurableStore);

// draft manager
const draftManager = new DraftManager(draftQueue);

// build the draft durable store plugins
const objectInfoPlugin = new RecordMetadataOnSetPlugin(ensureObjectInfoCached);
// creates a durable store that can have plugins registered with it
const pluginEnabledDurableStore = makePluginEnabledDurableStore(baseDurableStore);
pluginEnabledDurableStore.registerPlugins([objectInfoPlugin]);

// creates a durable store that denormalizes scalar fields for records
const recordDenormingStore = makeRecordDenormalizingDurableStore(pluginEnabledDurableStore, store);

const baseEnv = new Environment(store, networkAdapter);
const offlineEnv = makeOffline(baseEnv);
const durableEnv = makeDurable(offlineEnv, {
    durableStore: recordDenormingStore,
    compositeRetrievers: [getRecordsPropertyRetriever],
});
const draftEnv = makeEnvironmentDraftAware(durableEnv, {
    store,
    draftQueue,
    durableStore: recordDenormingStore,
    ingestFunc: recordIngestFunc,
    generateId: newRecordId,
    isDraftId: isGenerated,
    prefixForApiName,
    apiNameForPrefix,
    getRecord,
    userId,
    registerDraftKeyMapping: registerDraftMapping,
});

baseDurableStore.registerMergeStrategy(new RecordMergeStrategy(draftQueue, getRecord, userId));

luvio = new Luvio(draftEnv);
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
