import { Luvio, Store, Environment, CacheKeySet } from '@luvio/engine';
import { makeOffline, makeDurable } from '@luvio/environments';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';

import {
    RecordRepresentation,
    ingestRecord,
    keyBuilderRecord,
    buildSelectionFromRecord,
} from '@salesforce/lds-adapters-uiapi';
import {
    makeDurableStoreDraftAware,
    makeRecordDenormalizingDurableStore,
    makeEnvironmentDraftAware,
    DraftManager,
} from '@salesforce/lds-drafts';
import salesforceNetworkAdapter from '@salesforce/lds-network-adapter';

import userId from '@salesforce/user/Id';
import { recordIdGenerator } from './RecordIdGenerator';

import { NimbusNetworkAdapter } from './network/NimbusNetworkAdapter';
import { makeNetworkAdapterChunkRecordFields } from './network/record-field-batching/makeNetworkAdapterChunkRecordFields';
import { NimbusDurableStore } from './NimbusDurableStore';
import { buildLdsDraftQueue } from './DraftQueueFactory';
import { buildInternalAdapters } from './utils/adapters';
import { restoreDraftKeyMapping } from './utils/restoreDraftKeyMapping';
import { ObjectInfoService } from './utils/ObjectInfoService';
import { RecordMetadataOnSetPlugin } from './durableStore/plugins/RecordMetadataOnSetPlugin';
import { makePluginEnabledDurableStore } from './durableStore/makePluginEnabledDurableStore';
import { makeDurableStoreWithMergeStrategy } from './durableStore/makeDurableStoreWithMergeStrategy';
import { RecordMergeStrategy } from './durableStore/RecordMergeStrategy';

import { setupInstrumentation } from './instrumentation';
import { JSONParse, JSONStringify, ObjectCreate, ObjectKeys } from './utils/language';

let luvio: Luvio;

function onResponseSuccess(record: RecordRepresentation) {
    const selections = buildSelectionFromRecord(record);
    const key = keyBuilderRecord({
        recordId: record.id,
    });

    luvio.storeIngest(key, ingestRecord, record);
    const snapshot = luvio.storeLookup<RecordRepresentation>({
        recordId: key,
        node: {
            kind: 'Fragment',
            private: [],
            selections,
        },
        variables: {},
    });

    return snapshot;
}

// TODO [W-10054341]: this is done manually right now but can be removed when the compiler generates these functsino
function getRecordResponseKeys(originalRecord: RecordRepresentation) {
    const record = JSONParse(JSONStringify(originalRecord));
    const selections = buildSelectionFromRecord(record);
    const key = keyBuilderRecord({
        recordId: record.id,
    });

    luvio.storeIngest(key, ingestRecord, record);
    const snapshot = luvio.storeLookup<RecordRepresentation>({
        recordId: key,
        node: {
            kind: 'Fragment',
            private: [],
            selections,
        },
        variables: {},
    });

    if (snapshot.state === 'Error') {
        return {};
    }

    const keys = [...ObjectKeys(snapshot.seenRecords), snapshot.recordId];
    const keySet: CacheKeySet = ObjectCreate(null);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const namespace = key.split('::')[0];
        const representationName = key.split('::')[1].split(':')[0];
        keySet[key] = {
            namespace,
            representationName,
        };
    }
    return keySet;
}

// TODO [W-8291468]: have ingest get called a different way somehow
const recordIngestFunc = (record: RecordRepresentation): Promise<void> => {
    return Promise.resolve(
        luvio.handleSuccessResponse(
            () => onResponseSuccess(record),
            () => getRecordResponseKeys(record)
        )
    ).then(() => {
        // the signature requires a Promise<void> result so drop the Snapshot from the result
        return;
    });
};

const registerDraftIdMapping = (draftId: string, canonicalId: string) => {
    if (luvio !== undefined) {
        const draftKey = keyBuilderRecord({ recordId: draftId });
        const canonicalKey = keyBuilderRecord({ recordId: canonicalId });
        luvio.storeRedirect(draftKey, canonicalKey);
        luvio.storeBroadcast();
    }
};

const getDraftActionForRecordKeys = (keys: string[]) => {
    const objectSet: Record<string, true> = {};
    for (let i = 0, len = keys.length; i < len; i++) {
        objectSet[keys[i]] = true;
    }

    return draftQueue.getActionsForTags(objectSet);
};

// user id centric record ID generator
const { newRecordId, isGenerated } = recordIdGenerator(userId);

// non-draft-aware base services
// TODO [W-9883150]: use default scheduler
const storeOptions = {
    scheduler: () => {},
};
const store = new Store(storeOptions);
const networkAdapter = salesforceNetworkAdapter(
    makeNetworkAdapterChunkRecordFields(NimbusNetworkAdapter)
);

const baseDurableStore = makeDurableStoreWithMergeStrategy(new NimbusDurableStore());

// specific adapters
const internalAdapterStore = new Store();
const internalAdapterDurableStore = makeRecordDenormalizingDurableStore(
    baseDurableStore,
    () => internalAdapterStore.records,
    () => internalAdapterStore.metadata
);
const { getObjectInfo, getRecord } = buildInternalAdapters(
    internalAdapterStore,
    networkAdapter,
    internalAdapterDurableStore
);
const { ensureObjectInfoCached, apiNameForPrefix, prefixForApiName } = new ObjectInfoService(
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
const recordDenormingStore = makeRecordDenormalizingDurableStore(
    pluginEnabledDurableStore,
    () => store.records,
    () => store.metadata
);

const baseEnv = new Environment(store, networkAdapter);
const offlineEnv = makeOffline(baseEnv);
const durableEnv = makeDurable(offlineEnv, {
    durableStore: recordDenormingStore,
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
    getObjectInfo,
    userId,
    registerDraftIdMapping,
});

baseDurableStore.registerMergeStrategy(
    new RecordMergeStrategy(baseDurableStore, getDraftActionForRecordKeys, getRecord, userId)
);

luvio = new Luvio(draftEnv);

// Draft mapping entries exists only in the Durable store.
// Populate Luvio L1 cache with the entries from the Durable store.
// TODO [W-9941688]: A race condition is possible that an adapter may be invoked prior to the completion of restoring the mapping
restoreDraftKeyMapping(luvio, recordDenormingStore);

// Currently instruments store runtime perf
setupInstrumentation(luvio, store);

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
