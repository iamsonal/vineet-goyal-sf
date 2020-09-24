import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@ldsjs/environments';
import { ObjectCreate, ObjectKeys, ObjectAssign } from './utils/language';
import {
    isKeyRecordOrRecordField,
    getRecordKeyFromRecordOrField,
    isKeyRecord,
    normalizeRecordFields,
    denormalizeRecordFields,
} from './utils/records';
import {
    FieldValueRepresentationNormalized,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import { StoreLink, Store } from '@ldsjs/engine';

export interface DurableFieldValue<S = unknown> {
    value: FieldValueRepresentationNormalized;
    link: StoreLink;
}

export interface DurableRecordRepresentation
    extends Omit<RecordRepresentationNormalized, 'fields'> {
    fields: {
        [key: string]: DurableFieldValue;
    };
}

export function makeDurableStoreRecordAware(
    durableStore: DurableStore,
    store: Store
): DurableStore {
    const getEntries: typeof durableStore['getEntries'] = function(
        entries: string[]
    ): Promise<DurableStoreEntries | undefined> {
        if (entries.length === 0) {
            return Promise.resolve({});
        }

        const filteredEntryIds = [];
        const recordEntries: { [key: string]: boolean } = {};
        for (const id of entries) {
            if (isKeyRecordOrRecordField(id)) {
                const recordId = getRecordKeyFromRecordOrField(id);
                if (recordId !== undefined && recordEntries[recordId] === undefined) {
                    recordEntries[recordId] = true;
                    filteredEntryIds.push(recordId);
                }
            } else {
                filteredEntryIds.push(id);
            }
        }

        return durableStore
            .getEntries(filteredEntryIds)
            .then((durableEntries: DurableStoreEntries | undefined) => {
                if (durableEntries === undefined) {
                    return undefined;
                }

                const returnEntries: DurableStoreEntries = ObjectCreate(null);
                const keys = ObjectKeys(durableEntries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    const value = durableEntries[key];

                    if (isKeyRecord(key)) {
                        ObjectAssign(
                            returnEntries,
                            normalizeRecordFields(
                                key,
                                value as DurableStoreEntry<DurableRecordRepresentation>
                            )
                        );
                    } else {
                        returnEntries[key] = value;
                    }
                }
                return returnEntries;
            });
    };

    const setEntries: typeof durableStore['setEntries'] = function(
        entries: DurableStoreEntries
    ): Promise<void> {
        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        const putRecords: { [key: string]: boolean } = {};
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            let value = entries[key];

            // do not put normalized field values
            if (isKeyRecordOrRecordField(key)) {
                const recordKey = getRecordKeyFromRecordOrField(key);
                if (recordKey !== undefined) {
                    if (putRecords[recordKey] === true) {
                        continue;
                    }

                    putRecords[recordKey] = true;
                    value = denormalizeRecordFields(
                        {
                            expiration: store.recordExpirations[recordKey],
                            data: store.records[recordKey],
                        },
                        store
                    );
                    putEntries[recordKey] = value;
                    continue;
                }
            }

            putEntries[key] = value;
        }

        return durableStore.setEntries(putEntries);
    };

    return ObjectCreate(durableStore, {
        getEntries: { value: getEntries },
        setEntries: { value: setEntries },
    });
}
