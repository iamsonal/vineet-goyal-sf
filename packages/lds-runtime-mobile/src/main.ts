import type { RecordSource } from '@luvio/engine';
import { Luvio, Store, Environment } from '@luvio/engine';
import { makeDurable } from '@luvio/environments';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';

import type { StoreEval } from '@salesforce/lds-graphql-eval';
import { storeEvalFactory } from '@salesforce/lds-graphql-eval';

import type { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    ingestRecord,
    keyBuilderRecord,
    buildSelectionFromRecord,
    getTypeCacheKeysRecord,
} from '@salesforce/lds-adapters-uiapi';
import {
    makeDurableStoreDraftAware,
    makeRecordDenormalizingDurableStore,
    makeEnvironmentDraftAware,
    DraftManager,
} from '@salesforce/lds-drafts';
import {
    setupInstrumentation,
    instrumentLuvio,
    withInstrumentation,
    O11Y_NAMESPACE_LDS_MOBILE,
} from '@salesforce/lds-instrumentation';

import salesforceNetworkAdapter from '@salesforce/lds-network-adapter';

import userId from '@salesforce/user/Id';
import { recordIdGenerator } from './RecordIdGenerator';

import { NimbusNetworkAdapter } from './network/NimbusNetworkAdapter';
import { makeNetworkAdapterChunkRecordFields } from './network/record-field-batching/makeNetworkAdapterChunkRecordFields';
import { buildLdsDraftQueue } from './DraftQueueFactory';
import { buildInternalAdapters } from './utils/adapters';
import { restoreDraftKeyMapping } from './utils/restoreDraftKeyMapping';
import { ObjectInfoService } from './utils/ObjectInfoService';
import { RecordMetadataOnSetPlugin } from './durableStore/plugins/RecordMetadataOnSetPlugin';
import { makePluginEnabledDurableStore } from './durableStore/makePluginEnabledDurableStore';
import { makeDebugEnvironment } from './debug/makeDebugEnvironment';
import { NimbusSqlDurableStore } from './NimbusSqlDurableStore';
import { getInstrumentation } from 'o11y/client';

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

// TODO [W-8291468]: have ingest get called a different way somehow
const recordIngestFunc = (record: RecordRepresentation): Promise<void> => {
    return Promise.resolve(
        luvio.handleSuccessResponse(
            () => onResponseSuccess(record),
            // getTypeCacheKeysRecord uses the response, not the full path factory
            // so 2nd parameter will be unused
            () => getTypeCacheKeysRecord(record, () => '')
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
const store = new Store();
const networkAdapter = salesforceNetworkAdapter(
    makeNetworkAdapterChunkRecordFields(NimbusNetworkAdapter)
);

const baseDurableStore = new NimbusSqlDurableStore({
    withInstrumentation: withInstrumentation(getInstrumentation(O11Y_NAMESPACE_LDS_MOBILE)),
});

// specific adapters
const internalAdapterStore = new Store();
let getIngestRecordsForInternalAdapters: (() => RecordSource) | undefined;
let getIngestMetadataForInternalAdapters: (() => Store['metadata']) | undefined;
const internalAdapterDurableStore = makeRecordDenormalizingDurableStore(
    baseDurableStore,
    () =>
        getIngestRecordsForInternalAdapters !== undefined
            ? getIngestRecordsForInternalAdapters()
            : {},
    () =>
        getIngestMetadataForInternalAdapters !== undefined
            ? getIngestMetadataForInternalAdapters()
            : {}
);
const {
    adapters: { getObjectInfo, getRecord },
    durableEnvironment: internalAdapterDurableEnvironment,
} = buildInternalAdapters(internalAdapterStore, networkAdapter, internalAdapterDurableStore);
getIngestRecordsForInternalAdapters =
    internalAdapterDurableEnvironment.getIngestStagingStoreRecords;
getIngestMetadataForInternalAdapters =
    internalAdapterDurableEnvironment.getIngestStagingStoreRecords;
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
let getIngestRecords: (() => RecordSource) | undefined;
let getIngestMetadata: (() => Store['metadata']) | undefined;
const recordDenormingStore = makeRecordDenormalizingDurableStore(
    pluginEnabledDurableStore,
    () => (getIngestRecords !== undefined ? getIngestRecords() : {}),
    () => (getIngestMetadata !== undefined ? getIngestMetadata() : {})
);

const baseEnv = new Environment(store, networkAdapter);
const durableEnv = makeDurable(baseEnv, {
    durableStore: recordDenormingStore,
});
getIngestRecords = durableEnv.getIngestStagingStoreRecords;
getIngestMetadata = durableEnv.getIngestStagingStoreMetadata;
let draftEnv = makeEnvironmentDraftAware(durableEnv, {
    store,
    draftQueue,
    durableStore: recordDenormingStore,
    ingestFunc: recordIngestFunc,
    generateId: newRecordId,
    isDraftId: isGenerated,
    prefixForApiName,
    apiNameForPrefix,
    ensureObjectInfoCached,
    getRecord,
    getObjectInfo,
    userId,
    registerDraftIdMapping,
});

if (process.env.NODE_ENV !== 'production') {
    draftEnv = makeDebugEnvironment(draftEnv);
}

luvio = new Luvio(draftEnv, {
    instrument: instrumentLuvio,
});

//inject query eval to graphql adapter
const storeEval: StoreEval = storeEvalFactory(userId, baseDurableStore);

// Draft mapping entries exists only in the Durable store.
// Populate Luvio L1 cache with the entries from the Durable store.
// TODO [W-9941688]: A race condition is possible that an adapter may be invoked prior to the completion of restoring the mapping
restoreDraftKeyMapping(luvio, recordDenormingStore);

// Currently instruments store runtime perf
setupInstrumentation(luvio, store);

setDefaultLuvio({ luvio });

export { luvio, draftQueue, draftManager, storeEval };

export { debugLog } from './debug/DebugLog';

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

// re-export type to avoid leaky abstraction
export type { ObservabilityContext } from '@mobileplatform/nimbus-plugin-lds';
