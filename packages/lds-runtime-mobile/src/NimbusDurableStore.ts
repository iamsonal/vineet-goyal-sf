// so eslint doesn't complain about nimbus
/* global __nimbus */

import { DurableStore, DurableStoreEntries } from '@ldsjs/environments';
import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';
import { filterPendingFields } from './utils/records';
import { RecordRepresentationNormalized } from '@salesforce/lds-adapters-uiapi';

const RECORD_REPRESENTATION_PREFIX = 'UiApi::RecordRepresentation:';

export class NimbusDurableStore implements DurableStore {
    getEntries(entryIds: string[]): Promise<DurableStoreEntries | undefined> {
        return __nimbus.plugins.LdsDurableStore.getEntries(entryIds).then(result => {
            const { isMissingEntries, entries } = result;

            if (isMissingEntries) {
                return undefined;
            }

            const returnEntries: DurableStoreEntries = ObjectCreate(null);
            const keys = ObjectKeys(entries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                const value = entries[key];
                // values are stored on native side as JSON strings
                returnEntries[key] = JSONParse(value);
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

            // TODO: (W-8029812) properly filter record representations
            if (key.startsWith(RECORD_REPRESENTATION_PREFIX) && !key.includes('__fields__')) {
                value.data = filterPendingFields(value.data as RecordRepresentationNormalized);
            }

            // values are stored on native side as JSON strings
            putEntries[key] = JSONStringify(value);
        }

        return __nimbus.plugins.LdsDurableStore.setEntries(putEntries);
    }

    evictEntries(entryIds: string[]): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.evictEntries(entryIds);
    }
}
