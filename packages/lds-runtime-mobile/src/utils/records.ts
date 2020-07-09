import { RecordRepresentationNormalized } from '@salesforce/lds-adapters-uiapi';
import { StoreLink } from '@ldsjs/engine';
import { ObjectKeys, ObjectAssign } from './language';

export function filterPendingFields(
    record: RecordRepresentationNormalized
): RecordRepresentationNormalized {
    const fields = record.fields;
    const filteredFields: {
        [key: string]: StoreLink<unknown>;
    } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];
        if (field.pending !== true) {
            filteredFields[fieldName] = field;
        }
    }
    return ObjectAssign({}, record, { fields: filteredFields });
}
