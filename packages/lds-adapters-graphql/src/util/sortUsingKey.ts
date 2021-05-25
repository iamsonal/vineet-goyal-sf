export function sortAndCopyUsingObjectKey<T>(arr: Array<T>, key: string): Array<T> {
    return [...arr].sort((a: any, b: any) => {
        const aKey = a[key];
        const bKey = b[key];
        if (aKey < bKey) {
            return -1;
        }
        if (aKey > bKey) {
            return 1;
        }
        return 0;
    });
}
