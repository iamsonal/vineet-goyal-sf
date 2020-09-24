import { StoreLink, Store } from '@ldsjs/engine';
import { ObjectKeys, ObjectAssign } from './language';
import { DurableStoreEntry, DurableStoreEntries } from '@ldsjs/environments';
import { DurableFieldValue, DurableRecordRepresentation } from '../makeDurableStoreRecordAware';
import { RecordRepresentationNormalized } from '@salesforce/lds-adapters-uiapi';

const RECORD_REPRESENTATION_PREFIX = 'UiApi::RecordRepresentation:';
const RECORD_FIELDS_KEY_JUNCTION = '__fields__';

// TODO: this should be defined by lds-adapters-uiapi
function buildRecordFieldKey(recordKey: string, fieldName: string) {
    return `${recordKey}${RECORD_FIELDS_KEY_JUNCTION}${fieldName}`;
}

/**
 * This method denormalize field links so that a record can be looked up with all its fields in one
 * durable store read
 * @param record Record containing normalized field links
 * @param store
 */
export function denormalizeRecordFields(
    entry: DurableStoreEntry<RecordRepresentationNormalized>,
    store: Store
): DurableStoreEntry {
    const record = entry.data;
    const fields = record.fields;
    const filteredFields: {
        [key: string]: DurableFieldValue;
    } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        // pending fields get filtered out of the durable store
        // only pick up fields that contain references (i.e. they are not missing)
        const { pending, __ref } = field;
        if (pending !== true && __ref !== undefined) {
            const ref = store.records[__ref];
            // there is a dangling field reference, do not persist a
            // record if there's a field reference missing
            if (ref === undefined) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('failed to find normalized field reference');
                }
            }
            filteredFields[fieldName] = {
                value: ref,
                link: field,
            };
        }
    }

    return {
        expiration: entry.expiration,
        data: ObjectAssign({}, record, { fields: filteredFields }),
    };
}

/**
 * Normalizes record fields coming out of the DurableStore into StoreLinks
 * @param key
 * @param record
 */
export function normalizeRecordFields(
    key: string,
    entry: DurableStoreEntry<DurableRecordRepresentation>
): DurableStoreEntries {
    const record = entry.data;
    const fields = record.fields;
    const fieldNames = ObjectKeys(fields);
    const normalizedFields: {
        [key: string]: StoreLink<unknown>;
    } = {};
    const returnEntries: DurableStoreEntries = {};

    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        let field = fields[fieldName];
        const { value, link } = field;
        const fieldKey = buildRecordFieldKey(key, fieldName);
        returnEntries[fieldKey] = { data: { value } };
        normalizedFields[fieldName] = link;
    }
    returnEntries[key] = {
        data: ObjectAssign(record, { fields: normalizedFields }),
        expiration: entry.expiration,
    };
    return returnEntries;
}

/**
 * Extracts the record key from a record or record field key
 * @param key the store key for a record or a record field
 */
export function getRecordKeyFromRecordOrField(key: string) {
    const fieldsIdx = key.indexOf(RECORD_FIELDS_KEY_JUNCTION);
    return key.substring(0, fieldsIdx >= 0 ? fieldsIdx : undefined);
}

/**
 * Checks if a store key is a record or record field key
 * @param key the store key
 */
export function isKeyRecordOrRecordField(key: string) {
    return key.startsWith(RECORD_REPRESENTATION_PREFIX);
}

/**
 * Checks if a store key is a record key
 * @param key the store key
 */
export function isKeyRecord(key: string) {
    return (
        key.startsWith(RECORD_REPRESENTATION_PREFIX) && !key.includes(RECORD_FIELDS_KEY_JUNCTION)
    );
}
