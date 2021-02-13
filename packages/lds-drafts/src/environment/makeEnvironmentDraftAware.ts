import { Environment, IngestPath, Store } from '@luvio/engine';
import { DurableEnvironment, DurableStore, ResponsePropertyRetriever } from '@luvio/environments';

import { DraftQueue, DraftQueueEvent, DraftQueueEventType } from '../DraftQueue';
import { keyBuilderRecord, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { draftAwareHandleResponse } from '../makeNetworkAdapterDraftAware';
import { getRecordDraftEnvironment } from './getRecordDraftEnvironment';
import { createRecordDraftEnvironment } from './createRecordDraftEnvironment';
import { updateRecordDraftEnvironment } from './updateRecordDraftEnvironment';
import { deleteRecordDraftEnvironment } from './deleteRecordDraftEnvironment';

export interface DraftIdMappingEntry {
    draftKey: string;
    canonicalKey: string;
}

export const DRAFT_ID_MAPPINGS_SEGMENT = 'DRAFT_ID_MAPPINGS';

export interface DraftEnvironmentOptions {
    store: Store;
    draftQueue: DraftQueue;
    durableStore: DurableStore;
    // TODO - W-8291468 - have ingest get called a different way somehow
    ingestFunc: (
        record: RecordRepresentation,
        path: IngestPath,
        store: Store,
        timeStamp: number
    ) => void;
    generateId: (id: string) => string;
    isDraftId: (id: string) => boolean;
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[];
}

// retain draft id mappings for 30 days
const MAPPING_TTL = 30 * 24 * 60 * 60 * 1000;

function createDraftMappingEntryKey(draftKey: string, canonicalKey: string) {
    return `DraftIdMapping::${draftKey}::${canonicalKey}`;
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    options: DraftEnvironmentOptions
): Environment {
    const { draftQueue, recordResponseRetrievers, ingestFunc, store, durableStore } = options;

    draftQueue.startQueue();

    // register for when the draft queue completes an upload so we can properly
    // update subscribers
    draftQueue.registerOnChangedListener(
        (event: DraftQueueEvent): Promise<void> => {
            if (event.type !== DraftQueueEventType.ActionCompleted) {
                return Promise.resolve();
            }
            const { action } = event;
            const { request, tag } = action;

            if (request.method === 'delete') {
                env.storeEvict(tag);
                env.storeBroadcast(env.rebuildSnapshot);
                return Promise.resolve();
            }
            return draftAwareHandleResponse(
                request,
                action.response,
                draftQueue,
                recordResponseRetrievers
            ).then(response => {
                const record = response.body as RecordRepresentation;
                const key = keyBuilderRecord({ recordId: record.id });
                const path = {
                    fullPath: key,
                    parent: null,
                    propertyName: null,
                };

                ingestFunc(record, path, store, Date.now());
                env.storeBroadcast(env.rebuildSnapshot);

                if (request.method === 'post') {
                    const draftKey = action.tag;
                    const { id } = response.body;
                    const canonicalKey = keyBuilderRecord({ recordId: id });

                    const expiration = new Date().getMilliseconds() + MAPPING_TTL;
                    const entry: DraftIdMappingEntry = {
                        draftKey,
                        canonicalKey,
                    };
                    const entryKey = createDraftMappingEntryKey(draftKey, canonicalKey);
                    return durableStore.setEntries(
                        {
                            [entryKey]: {
                                data: entry,
                                expiration: { fresh: expiration, stale: expiration },
                            },
                        },
                        DRAFT_ID_MAPPINGS_SEGMENT
                    );
                }
            });
        }
    );

    const synthesizers = [
        getRecordDraftEnvironment,
        deleteRecordDraftEnvironment,
        updateRecordDraftEnvironment,
        createRecordDraftEnvironment,
    ];

    return synthesizers.reduce((environment, synthesizer) => {
        return synthesizer(environment, options);
    }, env);
}
