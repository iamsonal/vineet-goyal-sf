import { BackingStore } from '@mobileplatform/nimbus-plugin-lds';

export class DictionaryBackingStore implements BackingStore {
    private mock: Map<string, Map<string, string>> = new Map();

    get(key: string, segment: string): Promise<any | undefined> {
        const seg = this.mock[segment] || new Map();
        if (seg !== undefined) {
            return Promise.resolve(seg[key]);
        } else {
            return Promise.resolve(undefined);
        }
    }

    set(key: string, segment: string, value: any): Promise<void> {
        let seg = this.mock[segment] || new Map();
        seg[key] = value;
        this.mock[segment] = seg;
        return Promise.resolve();
    }

    delete(key: string, segment: string): Promise<void> {
        let seg = this.mock[segment] || new Map();
        delete seg[key];
        this.mock[segment] = seg;
        return Promise.resolve();
    }
    getAllKeys(segment: string): Promise<string[]> {
        const seg = this.mock[segment] || new Map();

        return Promise.resolve(Object.keys(seg) || []);
    }

    // resets the entire store, clears all segments
    reset(): Promise<void> {
        this.mock = new Map();
        return Promise.resolve();
    }
}
