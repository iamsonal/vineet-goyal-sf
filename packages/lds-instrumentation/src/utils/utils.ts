import { ArrayIsArray, JSONStringify, ObjectKeys } from './language';

/**
 * A deterministic JSON stringify implementation. Heavily adapted from https://github.com/epoberezkin/fast-json-stable-stringify.
 * This is needed because insertion order for JSON.stringify(object) affects output:
 * JSON.stringify({a: 1, b: 2})
 *      "{"a":1,"b":2}"
 * JSON.stringify({b: 2, a: 1})
 *      "{"b":2,"a":1}"
 * Modified from the apex implementation to sort arrays non-destructively.
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
        // copy any array before sorting so we don't mutate the object.
        // eslint-disable-next-line no-param-reassign
        node = node.slice(0).sort();
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

export function isPromise<D>(value: D | Promise<D> | null): value is Promise<D> {
    // check for Thenable due to test frameworks using custom Promise impls
    return value !== null && value !== undefined && typeof (value as any).then === 'function';
}
