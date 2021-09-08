export function isPromise<D>(value: D | Promise<D> | null): value is Promise<D> {
    // check for Thenable due to test frameworks using custom Promise impls
    return value !== null && (value as any).then !== undefined;
}
