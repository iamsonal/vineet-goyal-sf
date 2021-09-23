export function flatten<T>(previous: T[], current: T[]): T[] {
    return previous.concat(current);
}

export function flatMap<T, U>(transform: (t: T) => U[]): (acc: U[], current: T) => U[] {
    return (acc: U[], current: T) => {
        const mapped: U[] = transform(current);
        return acc.concat(mapped);
    };
}
