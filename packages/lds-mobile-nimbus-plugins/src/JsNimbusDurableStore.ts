import {
    DurableStore,
    DurableStoreChange,
    DurableStoreChangedInfo,
    DurableStoreEntries,
    DurableStoreFetchResult,
    DurableStoreOperation,
} from './DurableStore';

export interface BackingStore {
    get(key: string, segment: string): Promise<any | undefined>;
    set(key: string, segment: string, value: any): Promise<void>;
    delete(key: string, segment: string): Promise<void>;
    getAllKeys(segment: string): Promise<string[]>;

    // resets the entire store, clears all segments
    reset(): Promise<void>;
}

/**
 * A Javascript implementation of the Nimbus DurableStore plugin.  This is meant
 * to be used for testing/debugging purposes.  It is not meant for production
 * use.
 */
export class JsNimbusDurableStore implements DurableStore {
    protected backingStore: BackingStore;

    private listeners: { [listenerId: string]: (changes: DurableStoreChange[]) => void } = {};
    private count = 0;

    constructor(backingStore: BackingStore) {
        this.backingStore = backingStore;
    }

    resetStore(): Promise<void> {
        return this.backingStore.reset();
    }

    getEntriesInSegment(ids: string[], segment: string): Promise<DurableStoreFetchResult> {
        const returnSource: DurableStoreFetchResult = {
            isMissingEntries: false,
            entries: {},
        };

        return new Promise((resolve) => {
            Promise.all(
                ids.map((key) => {
                    return this.backingStore
                        .get(key, segment)
                        .then((record: string | undefined) => {
                            if (record === undefined) {
                                returnSource.isMissingEntries = true;
                            } else {
                                returnSource.entries[key] = record;
                            }
                        });
                })
            ).then(() => {
                resolve(returnSource);
            });
        });
    }

    getAllEntriesInSegment(segment: string): Promise<DurableStoreFetchResult> {
        return this.backingStore.getAllKeys(segment).then((keys) => {
            return this.getEntriesInSegment(keys, segment);
        });
    }

    /**
     * @deprecated Use batchOperations instead
     */
    setEntriesInSegment(entries: DurableStoreEntries, segment: string): Promise<void> {
        return this.setEntriesInSegmentWithSender(entries, segment, '');
    }

    /**
     * @deprecated Use batchOperations instead
     */
    setEntriesInSegmentWithSender(
        entries: DurableStoreEntries,
        segment: string,
        sender: string
    ): Promise<void> {
        return this.batchOperations(
            [{ ids: Object.keys(entries), entries, type: 'setEntries', segment }],
            sender
        );
    }

    /**
     * @deprecated Use batchOperations instead
     */
    evictEntriesInSegment(_ids: string[], _segment: string): Promise<void> {
        throw new Error('deprecated');
    }

    /**
     * @deprecated Use batchOperations instead
     */
    evictEntriesInSegmentWithSender(
        _ids: string[],
        _segment: string,
        _sender: string
    ): Promise<void> {
        throw new Error('deprecated');
    }

    async batchOperations(operations: DurableStoreOperation[], sender: string): Promise<void> {
        for (const operation of operations) {
            const { ids, segment, type, entries } = operation;
            switch (type) {
                case 'setEntries':
                    for (const id of ids) {
                        const entry = entries && entries[id];
                        if (entry !== undefined) {
                            await this.backingStore.set(id, segment, entry);
                        }
                    }
                    break;
                case 'evictEntries':
                    for (const id of ids) {
                        await this.backingStore.delete(id, segment);
                    }
                    break;
            }
        }

        const listenerIds = Object.keys(this.listeners);
        for (const id of listenerIds) {
            const listener = this.listeners[id];
            listener(
                operations.map((o) => {
                    return {
                        ids: o.ids,
                        segment: o.segment,
                        type: o.type,
                        sender,
                    };
                })
            );
        }
    }

    registerOnChangedListenerWithBatchInfo(
        listener: (changes: DurableStoreChange[]) => void
    ): Promise<string> {
        const id = (this.count++).toString();
        this.listeners[id] = listener;
        return Promise.resolve(id);
    }

    /**
     * @deprecated Use batchOperations instead
     */
    registerOnChangedListener(
        _listener: (ids: string[], segment: string) => void
    ): Promise<string> {
        throw new Error('deprecated');
    }

    /**
     * @deprecated Use batchOperations instead
     */
    registerOnChangedListenerWithInfo(
        _listener: (info: DurableStoreChangedInfo) => void
    ): Promise<string> {
        throw new Error('deprecated');
    }

    unsubscribeOnChangedListener(id: string): Promise<void> {
        delete this.listeners[id];
        return Promise.resolve();
    }
}
