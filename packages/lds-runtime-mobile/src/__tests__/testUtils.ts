import { JSONStringify } from '../utils/language';

export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Clone a JSON data payload.
 * @param {object} data The json data to clone
 * @returns {object} The cloned data in JSON format
 */
export function clone(data) {
    return JSON.parse(JSONStringify(data));
}
