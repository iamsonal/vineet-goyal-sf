import { DurableStore, DurableStoreEntry, DurableStoreOperation } from '@luvio/environments';
import { DraftAction, DraftIdMappingEntry } from './DraftQueue';
import { DRAFT_SEGMENT } from './main';
import { ObjectKeys } from './utils/language';
import { buildDraftDurableStoreKey } from './utils/records';

/**
 * Defines the store where drafts are persisted
 */
export interface DraftStore {
    writeAction(action: DraftAction<unknown, unknown>): Promise<void>;
    getAllDrafts(): Promise<DraftAction<unknown, unknown>[]>;
    deleteDrafts(actionIds: string[]): Promise<void>;
    // TODO [W-9832358]: the DraftStore should not have a dependency on durable store interfaces, ActionHandler needs to be refactored for this to happen
    batchOperations(
        operations: DurableStoreOperation<DraftAction<unknown, unknown> | DraftIdMappingEntry>[]
    ): Promise<void>;
}

/**
 * Implements the DraftStore interface and persists the drafts
 * into its own segment in the durable store
 */
export class DurableStoreDraftStore implements DraftStore {
    private durableStore: DurableStore;

    constructor(durableStore: DurableStore) {
        this.durableStore = durableStore;
    }

    writeAction(action: DraftAction<unknown, unknown>): Promise<void> {
        const { id, tag } = action;
        const durableEntryKey = buildDraftDurableStoreKey(tag, id);

        const entry: DurableStoreEntry = {
            data: action,
        };
        const entries = { [durableEntryKey]: entry };

        return this.durableStore.setEntries(entries, DRAFT_SEGMENT);
    }
    getAllDrafts<R, D>(): Promise<DraftAction<unknown, unknown>[]> {
        return this.durableStore
            .getAllEntries<DraftAction<unknown, unknown>>(DRAFT_SEGMENT)
            .then((durableEntries) => {
                const actions: DraftAction<unknown, unknown>[] = [];
                if (durableEntries === undefined) {
                    return actions;
                }
                const keys = ObjectKeys(durableEntries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const entry = durableEntries[keys[i]];
                    actions.push(entry.data);
                }

                return actions;
            });
    }
    deleteDrafts(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return Promise.resolve();
        }
        return this.durableStore.evictEntries(ids, DRAFT_SEGMENT);
    }

    batchOperations(
        operations: DurableStoreOperation<DraftAction<unknown, unknown> | DraftIdMappingEntry>[]
    ): Promise<void> {
        return this.durableStore.batchOperations(operations);
    }
}
