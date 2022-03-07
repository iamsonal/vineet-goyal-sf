import type { Luvio } from '@luvio/engine';
import type { DurableStore, DurableStoreEntry } from '@luvio/environments';
import type { DraftIdMappingEntry } from '@salesforce/lds-drafts';
import { DRAFT_ID_MAPPINGS_SEGMENT } from '@salesforce/lds-drafts';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { ObjectKeys } from './language';

/**
 * Reads all entries from the DRAFT_ID_MAPPINGS segment of
 * the durable store and sets luvio store redirects.
 *
 * @param luvio
 * @param durableStore
 * @returns Promise<void>
 */
export const restoreDraftKeyMapping = (luvio: Luvio, durableStore: DurableStore): Promise<void> => {
    return durableStore.getAllEntries(DRAFT_ID_MAPPINGS_SEGMENT).then((mappingEntries) => {
        if (mappingEntries === undefined) {
            return;
        }

        const keys = ObjectKeys(mappingEntries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const entry = mappingEntries[key] as DurableStoreEntry<DraftIdMappingEntry>;
            const { draftId, canonicalId } = entry.data;
            const draftKey = keyBuilderRecord({ recordId: draftId });
            const canonicalKey = keyBuilderRecord({ recordId: canonicalId });
            luvio.storeRedirect(draftKey, canonicalKey);
        }

        // After all the redirects, broadcast only once
        if (keys.length > 0) {
            luvio.storeBroadcast();
        }
    });
};
