import { RecordSource, Store, StoreLink } from '@luvio/engine';
import {
    DefaultDurableSegment,
    DurableStore,
    DurableStoreEntries,
    DurableStoreEntry,
} from '@luvio/environments';
import {
    FieldValueRepresentation,
    keyBuilderRecord,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
    isStoreKeyRecordId,
} from '@salesforce/lds-uiapi-record-utils';
import { ObjectAssign, ObjectCreate, ObjectKeys } from '../utils/language';
import {
    DraftRecordRepresentation,
    DurableRecordRepresentation,
    isStoreRecordError,
} from '../utils/records';

/**
 * Records are stored in the durable store with scalar fields denormalized. This function takes that denoramlized
 * durable store record representation and normalizes it back out into the format the the luvio store expects it
 * @param key Record store key
 * @param entry Durable entry containing a denormalized record representation
 * @returns a set of entries containing the normalized record and its normalized fields
 */
function normalizeRecordFields(
    key: string,
    entry: DurableStoreEntry<DurableRecordRepresentation>
): DurableStoreEntries<RecordRepresentationNormalized | FieldValueRepresentation> {
    const { data: record } = entry;
    const { fields, links } = record;

    const linkNames = ObjectKeys(links);
    const normalizedFields: {
        [key: string]: StoreLink<unknown>;
    } = {};
    const returnEntries: DurableStoreEntries<
        RecordRepresentationNormalized | FieldValueRepresentation
    > = {};

    for (let i = 0, len = linkNames.length; i < len; i++) {
        const fieldName = linkNames[i];
        const field = fields[fieldName];
        const link = links[fieldName];
        // field is undefined for missing links
        if (field !== undefined) {
            const fieldKey = buildRecordFieldStoreKey(key, fieldName);
            returnEntries[fieldKey] = { data: field as FieldValueRepresentation };
        }

        // we need to restore the undefined __ref node as it is
        // lost during serialization
        if (link.isMissing === true) {
            normalizedFields[fieldName] = { ...link, __ref: undefined };
        } else {
            normalizedFields[fieldName] = link;
        }
    }
    returnEntries[key] = {
        data: ObjectAssign(record, { fields: normalizedFields }) as RecordRepresentationNormalized,
        expiration: entry.expiration,
    };
    return returnEntries;
}

/**
 * Transforms a record for storage in the durable store. The transformation involves denormalizing
 * scalar fields and persisting link metadata to transform back into a normalized representation
 *
 * @param normalizedRecord Record containing normalized field links
 * @param recordStore a store containing referenced record fields
 */
function buildDurableRecordRepresentation(
    normalizedRecord: RecordRepresentationNormalized,
    records: RecordSource,
    pendingEntries: DurableStoreEntries<RecordRepresentationNormalized>
): DurableRecordRepresentation | undefined {
    const fields = normalizedRecord.fields;
    const filteredFields: {
        [key: string]: FieldValueRepresentation;
    } = {};
    const links: {
        [key: string]: StoreLink;
    } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        // pending fields get filtered out of the durable store
        const { pending } = field;
        if (pending === true) {
            continue;
        }

        const { __ref } = field;

        if (__ref !== undefined) {
            let ref = records[__ref];

            if (pendingEntries !== undefined) {
                // If the ref was part of the pending write that takes precedence
                const pendingEntry = pendingEntries[__ref];
                if (pendingEntry !== undefined) {
                    ref = pendingEntry.data;
                }
            }

            // there is a dangling field reference, do not persist a
            // record if there's a field reference missing
            if (ref === undefined) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('failed to find normalized field reference');
                }
                return undefined;
            }

            filteredFields[fieldName] = ref;
        }
        links[fieldName] = field;
    }

    return {
        ...normalizedRecord,
        fields: filteredFields,
        links,
    } as DurableRecordRepresentation;
}

export interface RecordDenormalizingDurableStore extends DurableStore {
    /**
     * Gets a record with denormalized scalar fields from the durable store (references are still normalized)
     * @param key Record key
     */
    getDenormalizedRecord(key: string): Promise<DraftRecordRepresentation | undefined>;
}

export function makeRecordDenormalizingDurableStore(
    durableStore: DurableStore,
    store: Store
): RecordDenormalizingDurableStore {
    const getEntries: typeof durableStore['getEntries'] = function <T>(
        entries: string[],
        segment: string
    ): Promise<DurableStoreEntries<T> | undefined> {
        // this HOF only inspects records in the default segment
        if (segment !== DefaultDurableSegment) {
            return durableStore.getEntries(entries, segment);
        }

        const { length: entriesLength } = entries;
        if (entriesLength === 0) {
            return Promise.resolve({});
        }

        // filter out record field keys
        const filteredEntryIds: string[] = [];
        // map of records to avoid requesting duplicate record keys when requesting both records and fields
        const recordEntries: Record<string, true> = {};

        for (let i = 0, len = entriesLength; i < len; i++) {
            const id = entries[i];
            const recordId = extractRecordIdFromStoreKey(id);

            if (recordId !== undefined) {
                if (recordEntries[recordId] === undefined) {
                    const key = keyBuilderRecord({ recordId });
                    recordEntries[recordId] = true;
                    filteredEntryIds.push(key);
                }
            } else {
                filteredEntryIds.push(id);
            }
        }

        // call base getEntries
        return durableStore.getEntries<T>(filteredEntryIds, segment).then((durableEntries) => {
            if (durableEntries === undefined) {
                return undefined;
            }
            const returnEntries: DurableStoreEntries<T> = ObjectCreate(null);
            const keys = ObjectKeys(durableEntries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                const value = durableEntries[key];

                if (value === undefined) {
                    continue;
                }

                if (isStoreKeyRecordId(key) && !isStoreRecordError(value.data)) {
                    ObjectAssign(
                        returnEntries,
                        normalizeRecordFields(
                            key,
                            value as unknown as DurableStoreEntry<DurableRecordRepresentation>
                        )
                    );
                } else {
                    returnEntries[key] = value;
                }
            }
            return returnEntries;
        });
    };

    const setEntries: typeof durableStore['setEntries'] = function <T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        if (segment !== DefaultDurableSegment) {
            return durableStore.setEntries(entries, segment);
        }

        const putEntries = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        const putRecords: { [key: string]: boolean } = {};
        const { records: storeRecords, recordExpirations: storeExpirations } = store;

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            let value = entries[key];

            const recordId = extractRecordIdFromStoreKey(key);
            // do not put normalized field values
            if (recordId !== undefined) {
                const recordKey = keyBuilderRecord({ recordId });
                if (putRecords[recordId] === true) {
                    continue;
                }

                const recordEntries =
                    entries as unknown as DurableStoreEntries<RecordRepresentationNormalized>;
                const entry = recordEntries[recordKey];
                let record = entry && entry.data;
                if (record === undefined) {
                    record = storeRecords[recordKey];
                }

                putRecords[recordId] = true;

                if (isStoreRecordError(record)) {
                    putEntries[recordKey] = value;
                    continue;
                }

                let expiration = entry && entry.expiration;
                if (entry === undefined) {
                    expiration = storeExpirations[recordKey];
                }

                const denormalizedRecord = buildDurableRecordRepresentation(
                    record,
                    storeRecords,
                    recordEntries
                );
                if (denormalizedRecord !== undefined) {
                    putEntries[recordKey] = {
                        data: denormalizedRecord,
                        expiration,
                    };
                }
            } else {
                putEntries[key] = value;
            }
        }

        return durableStore.setEntries(putEntries, segment);
    };

    /**
     * Retrieves a denormalized record from the store
     * NOTE: do no use this if you don't know what you're doing, this can still contain normalized record references
     * @param recordKey record key
     * @param durableStore the durable store
     * @returns a DraftRecordRepresentation containing the requested fields
     */
    const getDenormalizedRecord = function (recordKey: string) {
        return durableStore.getEntries([recordKey], DefaultDurableSegment).then((entries) => {
            if (entries === undefined) {
                return undefined;
            }

            const denormalizedEntry = entries[
                recordKey
            ] as DurableStoreEntry<DurableRecordRepresentation>;

            if (denormalizedEntry === undefined) {
                return undefined;
            }

            // don't include link information
            const denormalizedRecord = denormalizedEntry.data;

            if (isStoreRecordError(denormalizedRecord)) {
                return undefined;
            }

            return {
                ...denormalizedRecord,
                links: undefined,
            } as DraftRecordRepresentation;
        });
    };

    // TODO: W-9103958 -- record fields needs to be denormalized if included in a batch operation
    return ObjectCreate(durableStore, {
        getEntries: { value: getEntries, writable: true },
        setEntries: { value: setEntries, writable: true },
        getDenormalizedRecord: { value: getDenormalizedRecord, writable: true },
    });
}
