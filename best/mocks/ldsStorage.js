export function createStorage() {
    return {
        get: () => Promise.resolve({}),
    };
}
