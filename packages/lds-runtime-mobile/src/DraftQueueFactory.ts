// so eslint doesn't complain about nimbus
/* global __nimbus */

import { NetworkAdapter } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';

import {
    DraftQueue,
    DurableDraftQueue,
    updateQueueOnPost,
    createIdDraftMapping,
    DurableDraftStore,
} from '@salesforce/lds-drafts';
import { NimbusDraftQueue } from './NimbusDraftQueue';

export function buildLdsDraftQueue(
    network: NetworkAdapter,
    durableStore: DurableStore
): DraftQueue {
    if (
        typeof __nimbus !== 'undefined' &&
        __nimbus.plugins !== undefined &&
        __nimbus.plugins.LdsDraftQueue !== undefined
    ) {
        return new NimbusDraftQueue();
    }

    return new DurableDraftQueue(
        new DurableDraftStore(durableStore),
        network,
        updateQueueOnPost,
        createIdDraftMapping
    );
}
