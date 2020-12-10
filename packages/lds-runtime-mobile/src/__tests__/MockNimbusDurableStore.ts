import {
    DurableStore,
    DurableStoreFetchResult,
    DurableStoreEntries,
} from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusStoreGlobal(mockNimbusStore: MockNimbusDurableStore) {
    global.__nimbus = {
        ...(global.__nimbus ?? {}),
        plugins: {
            ...(global.__nimbus?.plugins || {}),
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}
export function resetNimbusStoreGlobal() {
    global.__nimbus = undefined;
}

// since MockNimbusDurableStore is likely to be re-instantiated before each test
// we hoist the registered listeners since that happens when the lds instance
// is created
let listenerFunc: (ids: string[], segment: string) => void;

export class MockNimbusDurableStore implements DurableStore {
    kvp: { [segment: string]: { [key: string]: string } } = {};

    // native apps prevent DurableStore OnChanged listener events from being raised
    // against their own DurableStore instance, so we simulate that here
    public raiseOnChangedEvent = false;

    async getEntriesInSegment(ids: string[], segment: string): Promise<DurableStoreFetchResult> {
        const result = {};
        const storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            return {
                isMissingEntries: true,
                entries: result,
            };
        }

        let isMissingEntries = false;
        for (const id of ids) {
            const val = storeSegment[id];
            if (val === undefined) {
                isMissingEntries = true;
            } else {
                result[id] = val;
            }
        }

        return {
            entries: result,
            isMissingEntries,
        };
    }

    async getAllEntriesInSegment(segment: string): Promise<DurableStoreFetchResult> {
        const result = {};
        const storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            return {
                isMissingEntries: true,
                entries: result,
            };
        }

        let isMissingEntries = false;
        const keys = Object.keys(storeSegment);
        for (const key of keys) {
            const val = storeSegment[key];
            if (val === undefined) {
                isMissingEntries = true;
            } else {
                result[key] = val;
            }
        }

        return {
            entries: result,
            isMissingEntries,
        };
    }

    setEntriesInSegment(entries: DurableStoreEntries, segment: string): Promise<void> {
        let storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            storeSegment = {};
            this.kvp[segment] = storeSegment;
        }

        Object.assign(storeSegment, entries);

        if (listenerFunc !== undefined && this.raiseOnChangedEvent) {
            listenerFunc(Object.keys(entries), segment);
        }

        return Promise.resolve();
    }

    evictEntriesInSegment(ids: string[], segment: string): Promise<void> {
        let storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            return Promise.resolve();
        }

        for (const id of ids) {
            delete storeSegment[id];
        }

        if (listenerFunc !== undefined && this.raiseOnChangedEvent) {
            listenerFunc(ids, segment);
        }

        return Promise.resolve();
    }

    registerOnChangedListener(listener: (ids: string[], segment: string) => void): Promise<string> {
        listenerFunc = listener;
        return Promise.resolve('1234');
    }

    unsubscribeOnChangedListener(_id: string): Promise<void> {
        listenerFunc = undefined;
        return Promise.resolve();
    }
}
