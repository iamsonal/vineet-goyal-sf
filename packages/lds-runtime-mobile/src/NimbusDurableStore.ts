// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    OnDurableStoreChangedListener,
} from '@ldsjs/environments';
import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';

export class NimbusDurableStore implements DurableStore {
    getEntries(entryIds: string[]): Promise<DurableStoreEntries | undefined> {
        if (entryIds.length === 0) {
            return Promise.resolve({});
        }

        return __nimbus.plugins.LdsDurableStore.getEntries(entryIds).then(result => {
            const { isMissingEntries, entries } = result;

            if (isMissingEntries) {
                return undefined;
            }

            const returnEntries: DurableStoreEntries = ObjectCreate(null);
            const keys = ObjectKeys(entries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                // values are stored on native side as JSON strings
                returnEntries[key] = JSONParse(entries[key]) as DurableStoreEntry;
            }
            return returnEntries;
        });
    }

    setEntries(entries: DurableStoreEntries): Promise<void> {
        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const value = entries[key];
            // values are stored on native side as JSON strings
            putEntries[key] = JSONStringify(value);
        }

        return __nimbus.plugins.LdsDurableStore.setEntries(putEntries);
    }

    evictEntries(entryIds: string[]): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.evictEntries(entryIds);
    }

    registerOnChangedListener(_listener: OnDurableStoreChangedListener): void {
        // no-op for now
    }
}
