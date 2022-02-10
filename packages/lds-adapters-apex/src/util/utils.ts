import type { FieldId } from '../types';
import { ArrayIsArray, JSONStringify, ObjectKeys } from './language';

/**
 * A deterministic JSON stringify implementation. Heavily adapted from https://github.com/epoberezkin/fast-json-stable-stringify.
 * This is needed because insertion order for JSON.stringify(object) affects output:
 * JSON.stringify({a: 1, b: 2})
 *      "{"a":1,"b":2}"
 * JSON.stringify({b: 2, a: 1})
 *      "{"b":2,"a":1}"
 * @param data Data to be JSON-stringified.
 * @returns JSON.stringified value with consistent ordering of keys.
 */
export function stableJSONStringify(node: any): string | undefined {
    // This is for Date values.
    if (node && node.toJSON && typeof node.toJSON === 'function') {
        // eslint-disable-next-line no-param-reassign
        node = node.toJSON();
    }
    if (node === undefined) {
        return;
    }
    if (typeof node === 'number') {
        return isFinite(node) ? '' + node : 'null';
    }
    if (typeof node !== 'object') {
        return JSONStringify(node);
    }

    let i;
    let out;
    if (ArrayIsArray(node)) {
        out = '[';
        for (i = 0; i < node.length; i++) {
            if (i) {
                out += ',';
            }
            out += stableJSONStringify(node[i]) || 'null';
        }
        return out + ']';
    }

    if (node === null) {
        return 'null';
    }

    const keys = ObjectKeys(node).sort();
    out = '';
    for (i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = stableJSONStringify(node[key]);

        if (!value) {
            continue;
        }
        if (out) {
            out += ',';
        }
        out += JSONStringify(key) + ':' + value;
    }
    return '{' + out + '}';
}

/**
 * Returns the field API name, qualified with an object name if possible.
 * @param value The value from which to get the qualified field API name.
 * @return The qualified field API name.
 */
export function getFieldApiName(value: string | FieldId): string {
    if (typeof value === 'string') {
        return value;
    } else if (
        value &&
        typeof value.objectApiName === 'string' &&
        typeof value.fieldApiName === 'string'
    ) {
        return value.objectApiName + '.' + value.fieldApiName;
    }
    throw new TypeError('Value is not a string or FieldId.');
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
