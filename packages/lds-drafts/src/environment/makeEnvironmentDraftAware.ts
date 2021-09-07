import { Adapter, Environment, Store } from '@luvio/engine';
import {
    DefaultDurableSegment,
    DurableEnvironment,
    DurableStoreChange,
    DurableStoreEntry,
} from '@luvio/environments';
import {
    DraftIdMappingEntry,
    DraftQueue,
    DraftQueueCompleteEvent,
    DraftQueueEvent,
    DraftQueueEventType,
} from '../DraftQueue';
import {
    GetObjectInfoConfig,
    ObjectInfoRepresentation,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { getRecordDraftEnvironment } from './getRecordDraftEnvironment';
import { createRecordDraftEnvironment } from './createRecordDraftEnvironment';
import {
    updateRecordDraftEnvironment,
    UpdateRecordDraftEnvironmentOptions,
} from './updateRecordDraftEnvironment';
import { deleteRecordDraftEnvironment } from './deleteRecordDraftEnvironment';
import { getRecordsDraftEnvironment } from './getRecordsDraftEnvironment';
import { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';
import { DRAFT_ID_MAPPINGS_SEGMENT } from '../DurableDraftQueue';
import { ObjectKeys } from '../utils/language';
import { isLDSDraftAction } from '../actionHandlers/LDSActionHandler';

type AllDraftEnvironmentOptions = DraftEnvironmentOptions & UpdateRecordDraftEnvironmentOptions;

export interface DraftEnvironmentOptions {
    store: Store;
    draftQueue: DraftQueue;
    durableStore: RecordDenormalizingDurableStore;
    // TODO [W-8291468]: have ingest get called a different way somehow
    ingestFunc: (record: RecordRepresentation) => void;
    generateId: (apiName: string) => string;
    isDraftId: (id: string) => boolean;
    apiNameForPrefix: (prefix: string) => Promise<string>;
    prefixForApiName: (apiName: string) => Promise<string>;
    userId: string;
    registerDraftKeyMapping: (draftKey: string, canonicalKey: string) => void;
    getObjectInfo: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>;
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    options: AllDraftEnvironmentOptions
): Environment {
    const { draftQueue, ingestFunc, durableStore, registerDraftKeyMapping } = options;

    function onDraftActionCompleting(event: DraftQueueCompleteEvent) {
        const { action } = event;
        if (isLDSDraftAction(action)) {
            const { data: request, tag } = action;
            const { method } = request;

            if (method === 'delete') {
                env.storeEvict(tag);
                env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
                return Promise.resolve();
            }
            const record = action.response.body as RecordRepresentation;

            ingestFunc(record);
            env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
        }
        return Promise.resolve();
    }

    // register for when the draft queue completes an upload so we can properly
    // update subscribers
    draftQueue.registerOnChangedListener((event: DraftQueueEvent): Promise<void> => {
        if (event.type === DraftQueueEventType.ActionCompleting) {
            return onDraftActionCompleting(event);
        }

        return Promise.resolve();
    });

    /**
     * Intercepts durable store changes to determine if a change to a draft action was made.
     * If a DraftAction changes, we need to evict the affected record from the in memory store
     * So it rebuilds with the new draft action applied to it
     */

    durableStore.registerOnChangedListener((changes: DurableStoreChange[]) => {
        const draftIdMappingsIds: string[] = [];

        for (let i = 0, len = changes.length; i < len; i++) {
            const change = changes[i];
            if (change.segment === DRAFT_ID_MAPPINGS_SEGMENT) {
                draftIdMappingsIds.push(...change.ids);
            }
        }

        if (draftIdMappingsIds.length > 0) {
            return durableStore
                .getEntries(draftIdMappingsIds, DRAFT_ID_MAPPINGS_SEGMENT)
                .then((mappingEntries) => {
                    if (mappingEntries === undefined) {
                        return;
                    }
                    const keys = ObjectKeys(mappingEntries);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        const key = keys[i];
                        const entry = mappingEntries[key] as DurableStoreEntry<DraftIdMappingEntry>;
                        const { draftKey, canonicalKey } = entry.data;
                        registerDraftKeyMapping(draftKey, canonicalKey);

                        // the mapping is setup, we can now delete the original draft
                        durableStore.evictEntries([draftKey], DefaultDurableSegment);
                    }
                });
        }
    });

    const synthesizers = [
        getRecordDraftEnvironment,
        deleteRecordDraftEnvironment,
        updateRecordDraftEnvironment,
        createRecordDraftEnvironment,
        getRecordsDraftEnvironment,
    ];

    return synthesizers.reduce((environment, synthesizer) => {
        return synthesizer(environment, options);
    }, env);
}
