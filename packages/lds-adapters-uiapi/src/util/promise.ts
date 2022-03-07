export function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
    return (value as any).then !== undefined;
}
