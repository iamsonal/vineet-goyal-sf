// so eslint doesn't complain about nimbus
/* global __nimbus */

import type { NetworkAdapter } from '@luvio/engine';
import type { DurableStore } from '@luvio/environments';

import type { DraftQueue } from '@salesforce/lds-drafts';
import { DurableDraftQueue, updateQueueOnPost, DurableDraftStore } from '@salesforce/lds-drafts';
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

    return new DurableDraftQueue(new DurableDraftStore(durableStore), network, updateQueueOnPost);
}
