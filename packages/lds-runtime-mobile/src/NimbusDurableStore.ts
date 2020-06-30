// so eslint doesn't complain about nimbus
/* global __nimbus */

import '@hybrid/nimbus-plugin-lds'; // TS needs this import for nimbus declaration
import { DurableStore, DurableStoreEntries } from '@ldsjs/environments';

export class NimbusDurableStore implements DurableStore {
    getEntries(entryIds: string[]): Promise<DurableStoreEntries | undefined> {
        return __nimbus.plugins.LdsDurableStore.getEntries(entryIds).then(result => {
            const { isMissingEntries, entries } = result;

            if (isMissingEntries) {
                return undefined;
            }

            const returnEntries: DurableStoreEntries = Object.create(null);
            const keys = Object.keys(entries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                const value = entries[key];
                // values are stored on native side as JSON strings
                returnEntries[key] = JSON.parse(value);
            }
            return returnEntries;
        });
    }

    setEntries(entries: DurableStoreEntries): Promise<void> {
        // TODO W-7644069 need to pluck out pending fields from records

        const putEntries = Object.create(null);
        const keys = Object.keys(entries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const value = entries[key];
            // values are stored on native side as JSON strings
            putEntries[key] = JSON.stringify(value);
        }

        return __nimbus.plugins.LdsDurableStore.setEntries(putEntries);
    }

    evictEntries(entryIds: string[]): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.evictEntries(entryIds);
    }
}
