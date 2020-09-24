import {
    DurableStore,
    DurableStoreFetchResult,
    DurableStoreEntries,
} from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusStoreGlobal(mockNimbusStore: MockNimbusDurableStore) {
    global.__nimbus = {
        plugins: {
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}
export function resetNimbusStoreGlobal() {
    global.__nimbus = undefined;
}

export class MockNimbusDurableStore implements DurableStore {
    kvp: { [key: string]: string } = {};

    async getEntries(ids: string[]): Promise<DurableStoreFetchResult> {
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

    setEntries(entries: DurableStoreEntries): Promise<void> {
        Object.assign(this.kvp, entries);
        return Promise.resolve();
    }
    evictEntries(ids: string[]): Promise<void> {
        for (const id of ids) {
            delete this.kvp[id];
        }
        return Promise.resolve();
    }
}
