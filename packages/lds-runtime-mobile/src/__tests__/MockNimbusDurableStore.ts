import {
    DurableStore,
    DurableStoreFetchResult,
    DurableStoreEntries,
    DurableStoreChangedInfo,
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
let listenerFunc: (info: DurableStoreChangedInfo) => void;
const changedId = '1234';

export class MockNimbusDurableStore implements DurableStore {
    kvp: { [segment: string]: { [key: string]: string } } = {};

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
        return this.setEntriesInSegmentWithSender(entries, segment, '');
    }

    setEntriesInSegmentWithSender(
        entries: DurableStoreEntries,
        segment: string,
        sender: string
    ): Promise<void> {
        let storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            storeSegment = {};
            this.kvp[segment] = storeSegment;
        }

        Object.assign(storeSegment, entries);

        if (listenerFunc !== undefined) {
            const info = { ids: Object.keys(entries), segment: segment, sender: sender };
            listenerFunc(info);
        }

        return Promise.resolve();
    }

    evictEntriesInSegment(ids: string[], segment: string): Promise<void> {
        return this.evictEntriesInSegmentWithSender(ids, segment, '');
    }

    evictEntriesInSegmentWithSender(ids: string[], segment: string, sender: string): Promise<void> {
        let storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            storeSegment = {};
        }

        for (const id of ids) {
            delete storeSegment[id];
        }

        if (listenerFunc !== undefined) {
            const info = { ids: ids, segment: segment, sender: sender };
            listenerFunc(info);
        }

        return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerOnChangedListener(listener: (ids: string[], segment: string) => void): Promise<string> {
        return Promise.resolve(changedId);
    }

    registerOnChangedListenerWithInfo(
        listener: (info: DurableStoreChangedInfo) => void
    ): Promise<string> {
        listenerFunc = listener;
        return Promise.resolve(changedId);
    }

    unsubscribeOnChangedListener(_id: string): Promise<void> {
        listenerFunc = undefined;
        return Promise.resolve();
    }
}
