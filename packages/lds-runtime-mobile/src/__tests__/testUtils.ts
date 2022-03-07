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

/**
 * Allows callers to await the Nth callback that has already taken place
 * or will take place in the future.
 */
export function callbackObserver<T>(): {
    waitForCallback: (n: number) => Promise<T>;
    callback: (t: T) => void;
    resetCount: () => void;
} {
    let count = 0;
    let resolves: { [key: number]: (t: T) => void } = {};
    let promises: { [key: number]: Promise<T> } = {};

    const waitForCallback = (n: number) => {
        if (promises[n] !== undefined) {
            return promises[n];
        }

        return (promises[n] = new Promise<T>((resolve) => {
            resolves[n] = resolve;
        }));
    };

    const callback = (t: T) => {
        const resolve = resolves[++count];
        if (resolve !== undefined) {
            resolve(t);
        } else {
            promises[count] = Promise.resolve(t);
        }
    };

    const resetCount = () => {
        count = 0;
        resolves = {};
        promises = {};
    };

    return { waitForCallback, callback, resetCount };
}
