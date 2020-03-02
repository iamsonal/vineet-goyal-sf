import { isString } from '../../validation/utils';

export interface FieldId {
    objectApiName: string;
    fieldApiName: string;
}

export function isFieldId(unknown: unknown): unknown is FieldId {
    if (typeof unknown !== 'object' || unknown === null) {
        return false;
    }

    const value = unknown as any;
    return isString(value.objectApiName) && isString(value.fieldApiName);
}

function stringToFieldId(fieldApiName: string): FieldId {
    const split = fieldApiName.split('.');
    if (process.env.NODE_ENV !== 'production') {
        if (split.length === 1) {
            // object api name must non-empty
            throw new TypeError('Value does not include an object API name.');
        }
    }
    return {
        objectApiName: split[0],
        fieldApiName: split[1],
    };
}

export function getFieldId(value: string | FieldId): FieldId {
    if (isFieldId(value)) {
        return value;
    }

    return stringToFieldId(value);
}

/**
 * Split the object API name and field API name from a qualified field name.
 * Eg: Opportunity.Title returns ['Opportunity', 'Title']
 * Eg: Opportunity.Account.Name returns ['Opportunity', 'Account.Name']
 * @param fieldApiName The qualified field name.
 * @return The object and field API names.
 */
export function splitQualifiedFieldApiName(fieldApiName: string): string[] {
    const idx = fieldApiName.indexOf('.');
    if (idx < 1) {
        // object api name must non-empty
        throw new TypeError('Value does not include an object API name.');
    }
    return [fieldApiName.substring(0, idx), fieldApiName.substring(idx + 1)];
}
