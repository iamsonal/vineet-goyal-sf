import { splitQualifiedFieldApiName, getFieldApiName } from './util/utils';
import { FieldId } from './types';
export { factory as GenerateGetApexWireAdapter, invoker as GetApexInvoker } from './wire/getApex';

/**
 * Gets a field value from an Apex sObject.
 * @param sobject The sObject holding the field.
 * @param field The qualified API name of the field to return.
 * @returns The field's value. If it doesn't exist, undefined is returned.
 */
export function getSObjectValue(sObject: any, field: string | FieldId): any {
    const unqualifiedField = splitQualifiedFieldApiName(getFieldApiName(field))[1];
    const fields = unqualifiedField.split('.');
    let ret = sObject;
    for (let i = 0, fieldsLength = fields.length; i < fieldsLength; i++) {
        const nextField = fields[i];
        if (!Object.prototype.hasOwnProperty.call(ret, nextField)) {
            return undefined;
        }
        ret = ret[nextField];
    }

    return ret;
}
