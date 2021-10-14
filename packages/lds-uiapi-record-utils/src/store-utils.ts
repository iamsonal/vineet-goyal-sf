export const API_NAMESPACE = 'UiApi';
export const RECORD_REPRESENTATION_NAME = 'RecordRepresentation';
export const RECORD_ID_PREFIX = `${API_NAMESPACE}::${RECORD_REPRESENTATION_NAME}:`;

const RECORD_FIELDS_KEY_JUNCTION = '__fields__';

export function isStoreKeyRecordId(key: string) {
    return (
        key.indexOf(RECORD_REPRESENTATION_NAME) > -1 &&
        key.indexOf(RECORD_FIELDS_KEY_JUNCTION) === -1
    );
}

export function isStoreKeyRecordField(key: string) {
    return (
        key.indexOf(RECORD_REPRESENTATION_NAME) > -1 && key.indexOf(RECORD_FIELDS_KEY_JUNCTION) > -1
    );
}

export function extractRecordIdFromStoreKey(key: string) {
    if (key === undefined || key.indexOf(RECORD_REPRESENTATION_NAME) === -1) {
        return undefined;
    }
    const parts = key.split(':');
    return parts[parts.length - 1].split('_')[0];
}

export function buildRecordFieldStoreKey(recordKey: string, fieldName: string) {
    return `${recordKey}${RECORD_FIELDS_KEY_JUNCTION}${fieldName}`;
}
