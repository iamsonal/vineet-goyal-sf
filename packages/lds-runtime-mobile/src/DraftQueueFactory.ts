// so eslint doesn't complain about nimbus
/* global __nimbus */

import { LDS, NetworkAdapter, Store } from '@ldsjs/engine';
import { DurableStore } from '@ldsjs/environments';
import {
    ingestRecord,
    RecordRepresentation,
    keyBuilderRecord,
} from '@salesforce/lds-adapters-uiapi';
import { DraftQueue, DurableDraftQueue } from '@salesforce/lds-drafts';
import { NimbusDraftQueue } from './NimbusDraftQueue';

export function configureLdsDraftQueue(
    network: NetworkAdapter,
    durableStore: DurableStore,
    ldsAccessor: () => LDS | undefined,
    store: Store
): DraftQueue {
    if (
        typeof __nimbus !== 'undefined' &&
        __nimbus.plugins !== undefined &&
        __nimbus.plugins.LdsDraftQueue !== undefined
    ) {
        return new NimbusDraftQueue();
    }

    const draftQueue = new DurableDraftQueue(durableStore, network);
    draftQueue.registerDraftQueueCompletedListener(action => {
        const { request, tag } = action;
        const lds = ldsAccessor();
        if (lds === undefined) {
            return;
        }

        if (request.method === 'delete') {
            lds.storeEvict(tag);
            lds.storeBroadcast();
        } else {
            const record = action.response.body as RecordRepresentation;
            const key = keyBuilderRecord({ recordId: record.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingestRecord(record, path, lds, store, Date.now());
            lds.storeBroadcast();
        }
    });

    return draftQueue;
}
