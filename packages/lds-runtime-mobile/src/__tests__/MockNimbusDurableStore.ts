import {
    DurableStore,
    DurableStoreFetchResult,
    DurableStoreEntries,
} from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusStoreGlobal(mockNimbusStore: MockNimbusDurableStore) {
    global.__nimbus = {
        ...(global.__nimbus ?? {}),
        plugins: {
            ...(global.__nimbus?.plugins ?? {}),
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}
export function resetNimbusStoreGlobal() {
    global.__nimbus = undefined;
}

export class MockNimbusDurableStore implements DurableStore {
    kvp: { [segment: string]: { [key: string]: string } } = {};
    listenerFunc: (ids: string[], segment: string) => void;

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
        return Promise.resolve();
    }

    registerOnChangedListener(listener: (ids: string[], segment: string) => void): Promise<void> {
        this.listenerFunc = listener;
        return Promise.resolve();
    }
}
