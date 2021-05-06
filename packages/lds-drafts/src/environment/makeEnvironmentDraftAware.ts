import { Environment, IngestPath, Store } from '@luvio/engine';
import {
    DurableEnvironment,
    DurableStoreChange,
    DurableStoreEntry,
    ResponsePropertyRetriever,
} from '@luvio/environments';
import {
    DraftIdMappingEntry,
    DraftQueue,
    DraftQueueCompleteEvent,
    DraftQueueEvent,
    DraftQueueEventType,
} from '../DraftQueue';
import { keyBuilderRecord, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { draftAwareHandleResponse } from '../makeNetworkAdapterDraftAware';
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

type AllDraftEnvironmentOptions = DraftEnvironmentOptions & UpdateRecordDraftEnvironmentOptions;

export interface DraftEnvironmentOptions {
    store: Store;
    draftQueue: DraftQueue;
    durableStore: RecordDenormalizingDurableStore;
    // TODO - W-8291468 - have ingest get called a different way somehow
    ingestFunc: (
        record: RecordRepresentation,
        path: IngestPath,
        store: Store,
        timeStamp: number
    ) => void;
    generateId: (apiName: string) => string;
    isDraftId: (id: string) => boolean;
    apiNameForPrefix: (prefix: string) => Promise<string>;
    prefixForApiName: (apiName: string) => Promise<string>;
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[];
    userId: string;
    registerDraftKeyMapping: (draftKey: string, canonicalKey: string) => void;
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    options: AllDraftEnvironmentOptions,
    userId: string
): Environment {
    const {
        draftQueue,
        recordResponseRetrievers,
        ingestFunc,
        store,
        durableStore,
        registerDraftKeyMapping,
    } = options;

    function onDraftActionCompleting(event: DraftQueueCompleteEvent) {
        const { action } = event;
        const { request, tag } = action;
        const { method } = request;

        if (method === 'delete') {
            env.storeEvict(tag);
            env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
            return Promise.resolve();
        }
        return draftAwareHandleResponse(
            request,
            action.response,
            draftQueue,
            recordResponseRetrievers,
            userId
        ).then(response => {
            const record = response.body as RecordRepresentation;
            const key = keyBuilderRecord({ recordId: record.id });
            const path = {
                fullPath: key,
                parent: null,
                propertyName: null,
            };

            ingestFunc(record, path, store, Date.now());
            env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
        });
    }

    function onDraftActionCompleted(event: DraftQueueCompleteEvent) {
        return env.reviveRecordsToStore([event.action.tag]).then(() => {
            env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
        });
    }

    // register for when the draft queue completes an upload so we can properly
    // update subscribers
    draftQueue.registerOnChangedListener(
        (event: DraftQueueEvent): Promise<void> => {
            if (event.type === DraftQueueEventType.ActionCompleting) {
                return onDraftActionCompleting(event);
            }

            if (event.type === DraftQueueEventType.ActionCompleted) {
                return onDraftActionCompleted(event);
            }

            return Promise.resolve();
        }
    );

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
                .then(mappingEntries => {
                    if (mappingEntries === undefined) {
                        return;
                    }
                    const keys = ObjectKeys(mappingEntries);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        const key = keys[i];
                        const entry = mappingEntries[key] as DurableStoreEntry<DraftIdMappingEntry>;
                        const { draftKey, canonicalKey } = entry.data;
                        registerDraftKeyMapping(draftKey, canonicalKey);
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
