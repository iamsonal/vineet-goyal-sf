import { splitQualifiedFieldApiName, getFieldApiName } from './util/utils';
import { ObjectPrototypeHasOwnProperty } from './util/language';
import { untrustedIsObject } from './generated/adapters/adapter-utils';
import type { FieldId } from './types';
/**
 * Gets a field value from an Apex sObject.
 * @param sobject The sObject holding the field.
 * @param field The qualified API name of the field to return.
 * @returns The field's value. If it doesn't exist, undefined is returned.
 */
export function getSObjectValue(sObject: any, field: string | FieldId): any {
    if (untrustedIsObject(sObject) === false) {
        return;
    }

    const unqualifiedField = splitQualifiedFieldApiName(getFieldApiName(field))[1];
    const fields = unqualifiedField.split('.');
    let ret = sObject;
    for (let i = 0, fieldsLength = fields.length; i < fieldsLength; i++) {
        const nextField = fields[i];
        if (!ObjectPrototypeHasOwnProperty.call(ret, nextField)) {
            return undefined;
        }
        ret = ret[nextField];
    }

    return ret;
}
