export const RECORD_ID_PREFIX = 'UiApi::RecordRepresentation:';
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

export function isStoreKeyRecordOrRecordField(key: string) {
    if (key === undefined) {
        return false;
    }
    return key.startsWith(RECORD_ID_PREFIX);
}

export function extractRecordIdFromStoreKey(key: string) {
    const matches = key.match(RECORD_OR_RECORD_FIELD_REGEXP);
    if (!matches || matches.length !== 2) {
        return undefined;
    }
    return matches[1];
}

export function buildRecordFieldStoreKey(recordKey: string, fieldName: string) {
    return `${recordKey}${RECORD_FIELDS_KEY_JUNCTION}${fieldName}`;
}
