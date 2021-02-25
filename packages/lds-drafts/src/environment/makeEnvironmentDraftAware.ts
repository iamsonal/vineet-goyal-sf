import { Environment, IngestPath, Store } from '@luvio/engine';
import { DurableEnvironment, DurableStore, ResponsePropertyRetriever } from '@luvio/environments';

import {
    DraftQueue,
    DraftQueueCompleteEvent,
    DraftQueueEvent,
    DraftQueueEventType,
} from '../DraftQueue';
import { keyBuilderRecord, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { draftAwareHandleResponse } from '../makeNetworkAdapterDraftAware';
import { getRecordDraftEnvironment } from './getRecordDraftEnvironment';
import { createRecordDraftEnvironment } from './createRecordDraftEnvironment';
import { updateRecordDraftEnvironment } from './updateRecordDraftEnvironment';
import { deleteRecordDraftEnvironment } from './deleteRecordDraftEnvironment';
import { getRecordsDraftEnvironment } from './getRecordsDraftEnvironment';

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
    generateId: (apiName: string) => string;
    isDraftId: (id: string) => boolean;
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[];
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    options: DraftEnvironmentOptions
): Environment {
    const { draftQueue, recordResponseRetrievers, ingestFunc, store } = options;

    draftQueue.startQueue();

    function onDraftActionCompleting(event: DraftQueueCompleteEvent) {
        const { action } = event;
        const { request, tag } = action;
        const { method } = request;

        if (method === 'delete') {
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
        });
    }

    function onDraftActionCompleted(event: DraftQueueCompleteEvent) {
        return env.reviveRecordsToStore([event.action.tag]).then(() => {
            env.storeBroadcast(env.rebuildSnapshot);
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
