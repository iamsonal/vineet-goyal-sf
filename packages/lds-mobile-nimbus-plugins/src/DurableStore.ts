// NOTE: do not remove this import, even though it looks unused it is necessary
// for TS module merging to work properly
import { NimbusPlugins } from 'nimbus-types';
declare module 'nimbus-types' {
    export interface NimbusPlugins {
        LdsDurableStore: DurableStore;
    }
}

export interface DurableStoreChangedInfo {
    ids: string[];
    segment: string;
    sender: string;
}

export interface DurableStoreChange {
    ids: string[];
    segment: string;
    type: DurableStoreOperationType;
    sender: string;
}

/**
 * A `DurableStore` persists entries beyond the lifetime of the LDS instance.
 */
export interface DurableStore {
    /**
     * Looks up a set of entries based on their id.
     *
     * This method may return a subset or superset of the requested ids. Check
     * the `isMissingEntries` property of the result to determine if any
     * requested ids were not fetched.
     *
     * @param ids a list of ids to lookup in the store
     * @param segment The durable store segment to query
     */
    getEntriesInSegment(ids: string[], segment: string): Promise<DurableStoreFetchResult>;

    /**
     * Retrieves all entries in the given segment
     *
     * If the given segment does not exist, then `isMissingEntries`
     * will be `true` on the result.
     *
     * @param segment The durable store segment to query
     */
    getAllEntriesInSegment(segment: string): Promise<DurableStoreFetchResult>;

    /**
     * @deprecated Use batchOperations instead
     */
    setEntriesInSegment(entries: DurableStoreEntries, segment: string): Promise<void>;

    /**
     * A collection of durable store operations to perform.
     *
     * @param operations the array of batched operations
     */
    batchOperations(operations: DurableStoreOperation[], sender: string): Promise<void>;

    /**
     * @deprecated Use batchOperations instead
     */
    setEntriesInSegmentWithSender(
        entries: DurableStoreEntries,
        segment: string,
        sender: string
    ): Promise<void>;

    /**
     * @deprecated Use batchOperations instead
     */
    evictEntriesInSegment(ids: string[], segment: string): Promise<void>;

    /**
     * @deprecated Use batchOperations instead
     */
    evictEntriesInSegmentWithSender(ids: string[], segment: string, sender: string): Promise<void>;

    /**
     * @deprecated Use registerOnChangedListenerWithBatchInfo instead
     */
    registerOnChangedListener(listener: (ids: string[], segment: string) => void): Promise<string>;

    /**
     * @deprecated Use registerOnChangedListenerWithBatchInfo instead
     */
    registerOnChangedListenerWithInfo(
        listener: (info: DurableStoreChangedInfo) => void
    ): Promise<string>;

    /**
     * Setup a listener to be notified of changes to the Durable Store
     *
     * @param listener callback giving an array of durable store entry
     * ids that changed.
     * @returns {Promise<string>} a generated id of the listener to unsubscribe with
     */
    registerOnChangedListenerWithBatchInfo(
        listener: (changes: DurableStoreChange[]) => void
    ): Promise<string>;

    /**
     *
     * @param id the identifier given from registerOnChangedListener
     */
    unsubscribeOnChangedListener(id: string): Promise<void>;
}

/**
 * The result of looking up records in the store.
 */
export interface DurableStoreFetchResult {
    /**
     * The entries that were loaded from the store.
     *
     * This collection may contain a subset or superset of the requested ids.
     */
    entries: DurableStoreEntries;

    /**
     * Indicates whether any requested ids were missing and omitted from `entries`.
     */
    isMissingEntries: boolean;
}

/**
 * A map of id to value, where the value is a JSON-encoded string.
 */
export interface DurableStoreEntries {
    [id: string]: string;
}

/**
 * Batch entry type
 */
export type DurableStoreOperationType = 'setEntries' | 'evictEntries';

/**
 * Interface for either an evict or set batched operation.
 */
export interface DurableStoreOperation {
    type: DurableStoreOperationType;
    segment: string;
    ids: string[];
    entries?: DurableStoreEntries;
}
