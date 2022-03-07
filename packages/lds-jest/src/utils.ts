export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

export function clone<T>(source: T): T {
    return JSON.parse(JSON.stringify(source));
}
