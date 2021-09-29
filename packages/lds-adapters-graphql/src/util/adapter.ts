import { ArrayIsArray, JSONStringify, ObjectFreeze, ObjectKeys } from './language';

export function untrustedIsObject<Base>(untrusted: unknown): untrusted is Untrusted<Base> {
    return typeof untrusted === 'object' && untrusted !== null && ArrayIsArray(untrusted) === false;
}

export type Untrusted<Base> = Partial<Base>;

export function deepFreeze(value: unknown) {
    // No need to freeze primitives
    if (typeof value !== 'object' || value === null) {
        return;
    }
    if (ArrayIsArray(value)) {
        for (let i = 0, len = value.length; i < len; i += 1) {
            deepFreeze(value[i]);
        }
    } else {
        const keys = ObjectKeys(value) as Array<keyof typeof value>;

        for (let i = 0, len = keys.length; i < len; i += 1) {
            const v = value[keys[i]];
            deepFreeze(v);
        }
    }
    return ObjectFreeze(value);
}

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
export function stableJSONStringify(node: any): string {
    // This is for Date values.
    if (node && node.toJSON && typeof node.toJSON === 'function') {
        // eslint-disable-next-line no-param-reassign
        node = node.toJSON();
    }
    if (node === undefined) {
        return '';
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
        node.sort();
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
        out += key + ':' + value;
    }
    return '{' + out + '}';
}

export const apiFamilyName = 'GraphQL';
export const representationName = 'graphql';
export const keyPrefix = `${apiFamilyName}::`;
