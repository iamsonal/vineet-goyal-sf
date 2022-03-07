import type { DurableStore, DurableStoreEntry } from '@luvio/environments';

/**
 * Plugin interface to execute code during Durable Store setEntities.
 * Allowing us to make the HOF pattern more readable with the expanding code needed for Drafts.
 */
export interface DurableStoreSetEntryPlugin {
    /**
     * Called before the entry is set into the Durable Store
     * @param key entry key
     * @param entry
     * @param segment segment of the Durable Store
     */
    beforeSet<T>(
        key: string,
        entry: DurableStoreEntry<Extract<T, unknown>>,
        segment: string,
        store: DurableStore
    ): Promise<void>;
}
