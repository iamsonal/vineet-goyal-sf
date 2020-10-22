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
    kvp: { [key: string]: string } = {};
    listenerFunc: (ids: string[], segment: string) => void;

    async getEntriesInSegment(ids: string[], _segment: string): Promise<DurableStoreFetchResult> {
        const result = {};
        let isMissingEntries = false;
        for (const id of ids) {
            const val = this.kvp[id];
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

    async getAllEntriesInSegment(_segment: string): Promise<DurableStoreFetchResult> {
        const result = {};
        let isMissingEntries = false;
        const keys = Object.keys(this.kvp);
        for (const key of keys) {
            const val = this.kvp[key];
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

    setEntriesInSegment(entries: DurableStoreEntries, _segment: string): Promise<void> {
        Object.assign(this.kvp, entries);
        return Promise.resolve();
    }

    evictEntriesInSegment(ids: string[], _segment: string): Promise<void> {
        for (const id of ids) {
            delete this.kvp[id];
        }
        return Promise.resolve();
    }

    registerOnChangedListener(listener: (ids: string[], segment: string) => void): Promise<void> {
        this.listenerFunc = listener;
        return Promise.resolve();
    }
}
