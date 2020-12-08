// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    OnDurableStoreChangedListener,
} from '@luvio/environments';
import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';

export class NimbusDurableStore implements DurableStore {
    getEntries(entryIds: string[], segment: string): Promise<DurableStoreEntries | undefined> {
        if (entryIds.length === 0) {
            return Promise.resolve({});
        }

        return __nimbus.plugins.LdsDurableStore.getEntriesInSegment(entryIds, segment).then(
            result => {
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
            }
        );
    }

    getAllEntries(segment: string): Promise<DurableStoreEntries | undefined> {
        return __nimbus.plugins.LdsDurableStore.getAllEntriesInSegment(segment).then(result => {
            const { isMissingEntries, entries } = result;

            // if the segment isn't found then isMissingEntries will be set and
            // we should return undefined.
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

    setEntries(entries: DurableStoreEntries, segment: string): Promise<void> {
        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const value = entries[key];
            // values are stored on native side as JSON strings
            putEntries[key] = JSONStringify(value);
        }

        return __nimbus.plugins.LdsDurableStore.setEntriesInSegment(putEntries, segment);
    }

    evictEntries(entryIds: string[], segment: string): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.evictEntriesInSegment(entryIds, segment);
    }

    registerOnChangedListener(listener: OnDurableStoreChangedListener): () => Promise<void> {
        __nimbus.plugins.LdsDurableStore.registerOnChangedListener(
            (ids: string[], segment: string) => {
                const map: { [key: string]: true } = {};
                for (let i = 0, len = ids.length; i < len; i++) {
                    map[ids[i]] = true;
                }
                listener(map, segment);
            }
        );

        return () => {
            return Promise.resolve();
        };
    }
}
