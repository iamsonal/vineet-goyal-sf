export const RECORD_ID_PREFIX = 'UiApi::RecordRepresentation:';
const RECORD_ID_REGEXP = new RegExp(`^${RECORD_ID_PREFIX}([a-zA-Z0-9])+$`);
const RECORD_FIELD_REGEXP = new RegExp(
    `^${RECORD_ID_PREFIX}([a-zA-Z0-9]+)+__fields__([a-zA-Z0-9]+)+$`
);

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
