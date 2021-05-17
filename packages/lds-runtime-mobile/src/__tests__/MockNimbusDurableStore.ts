import { BackingStore, JsNimbusDurableStore } from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusStoreGlobal(mockNimbusStore: JsNimbusDurableStore) {
    global.__nimbus = {
        ...(global.__nimbus || {}),
        plugins: {
            ...(global.__nimbus?.plugins || {}),
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}

export function resetNimbusStoreGlobal() {
    global.__nimbus = undefined;
}

export class InMemoryBackingStore implements BackingStore {
    kvp: { [segment: string]: { [key: string]: string } } = {};

    get(key: string, segment: string): Promise<any> {
        const storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(storeSegment[key]);
    }

    set(key: string, segment: string, value: any): Promise<void> {
        let storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            storeSegment = {};
            this.kvp[segment] = storeSegment;
        }

        storeSegment[key] = value;
        return Promise.resolve();
    }

    delete(key: string, segment: string): Promise<void> {
        const storeSegment = this.kvp[segment];
        if (storeSegment !== undefined) {
            delete storeSegment[key];
        }
        return Promise.resolve();
    }

    getAllKeys(segment: string): Promise<string[]> {
        const storeSegment = this.kvp[segment];
        if (storeSegment === undefined) {
            return Promise.resolve([]);
        }

        return Promise.resolve(Object.keys(storeSegment));
    }

    reset(): Promise<void> {
        this.kvp = {};
        return Promise.resolve();
    }
}

export class MockNimbusDurableStore extends JsNimbusDurableStore {
    constructor() {
        super(new InMemoryBackingStore());
    }

    get kvp() {
        return (this.backingStore as InMemoryBackingStore).kvp;
    }

    set kvp(value) {
        (this.backingStore as InMemoryBackingStore).kvp = value;
    }
}
