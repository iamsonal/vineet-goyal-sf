// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
    OnDurableStoreChangedListener,
} from '@luvio/environments';
import { DurableStoreChangedInfo } from '@mobileplatform/nimbus-plugin-lds';
import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';

export class NimbusDurableStore implements DurableStore {
    senderId: string = this.generateSenderId();

    private generateSenderId(): string {
        const random = Math.floor(Math.random() * 1000000000);
        return random.toString();
    }

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

        if (__nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender(
                putEntries,
                segment,
                this.senderId
            );
        }
        return __nimbus.plugins.LdsDurableStore.setEntriesInSegment(putEntries, segment);
    }

    evictEntries(entryIds: string[], segment: string): Promise<void> {
        if (__nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender(
                entryIds,
                segment,
                this.senderId
            );
        }
        return __nimbus.plugins.LdsDurableStore.evictEntriesInSegment(entryIds, segment);
    }

    private registerOldChangedListener(
        listener: OnDurableStoreChangedListener
    ): () => Promise<void> {
        let uuid: string | undefined = undefined;
        __nimbus.plugins.LdsDurableStore.registerOnChangedListener((ids, segment) => {
            const map: { [key: string]: true } = {};
            for (let i = 0, len = ids.length; i < len; i++) {
                map[ids[i]] = true;
            }
            // external is inferred to be true here because the old behavior
            // doesn't raise changed events to itself
            listener(map, segment, true);
        }).then(id => {
            uuid = id;
        });
        return () => {
            if (
                uuid !== undefined &&
                uuid.length > 0 &&
                __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener !== undefined
            ) {
                __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener(uuid);
            }
            return Promise.resolve();
        };
    }

    registerOnChangedListener(listener: OnDurableStoreChangedListener): () => Promise<void> {
        if (__nimbus.plugins.LdsDurableStore.registerOnChangedListenerWithInfo === undefined) {
            return this.registerOldChangedListener(listener);
        }
        let uuid: string | undefined = undefined;
        __nimbus.plugins.LdsDurableStore.registerOnChangedListenerWithInfo(
            (info: DurableStoreChangedInfo) => {
                const map: { [key: string]: true } = {};
                for (let i = 0, len = info.ids.length; i < len; i++) {
                    map[info.ids[i]] = true;
                }
                const isExternal = info.sender !== this.senderId;
                listener(map, info.segment, isExternal);
            }
        ).then(id => {
            uuid = id;
        });
        return () => {
            if (
                uuid !== undefined &&
                uuid.length > 0 &&
                __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener !== undefined
            ) {
                __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener(uuid);
            }
            return Promise.resolve();
        };
    }
}
