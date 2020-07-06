import { Store } from '@ldsjs/engine';
import { DurableStore } from '@ldsjs/environments';
import { ObjectKeys } from '../../util/language';

export function reviveRecordsFromDurableStore(
    records: { [key: string]: boolean },
    store: Store,
    durableStore: DurableStore
): Promise<void> {
    // only revive the keys not already in the store
    const keys = ObjectKeys(records).filter(key => store.records[key] === undefined);
    return durableStore.getEntries(keys).then(records => {
        if (records === undefined) {
            return;
        }
        // write records directly to store
        const keys = ObjectKeys(records);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            // don't revive records that have store entries
            if (store.records[key] === undefined) {
                const { expiration, data } = records[key];
                store.records[key] = data;
                if (expiration !== undefined) {
                    store.recordExpirations[key] = expiration;
                }
            }
        }
    });
}
