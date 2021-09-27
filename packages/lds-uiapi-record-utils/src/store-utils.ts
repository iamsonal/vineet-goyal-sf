export const API_NAMESPACE = 'UiApi';
export const RECORD_REPRESENTATION_NAME = 'RecordRepresentation';
export const RECORD_ID_PREFIX = `${API_NAMESPACE}::${RECORD_REPRESENTATION_NAME}:`;

const RECORD_ID_REGEXP = new RegExp(`^${RECORD_ID_PREFIX}([a-zA-Z0-9])+$`);
const RECORD_FIELD_REGEXP = new RegExp(
    `^${RECORD_ID_PREFIX}([a-zA-Z0-9]+)+__fields__([a-zA-Z0-9]+)+$`
);
const RECORD_FIELDS_KEY_JUNCTION = '__fields__';
const RECORD_OR_RECORD_FIELD_REGEXP = new RegExp(`^${RECORD_ID_PREFIX}([a-zA-Z0-9]+)+.*$`);

export function isStoreKeyRecordId(key: string) {
    return RECORD_ID_REGEXP.test(key);
}

export function isStoreKeyRecordField(key: string) {
    return RECORD_FIELD_REGEXP.test(key);
}

export function extractRecordIdFromStoreKey(key: string) {
    if (key === undefined) {
        return undefined;
    }
    const matches = key.match(RECORD_OR_RECORD_FIELD_REGEXP);
    if (!matches || matches.length !== 2) {
        return undefined;
    }
    return matches[1];
}

export function buildRecordFieldStoreKey(recordKey: string, fieldName: string) {
    return `${recordKey}${RECORD_FIELDS_KEY_JUNCTION}${fieldName}`;
}
