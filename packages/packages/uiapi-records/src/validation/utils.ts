import { ArrayIsArray, ObjectKeys } from '../util/language';

export function isString(value: any): value is string {
    return typeof value === 'string';
}

/**
 * Converts a value to an array. If the value is null/undefined, an empty array is returned.
 * @param value The value to convert to an array.
 * @returns value if it's an array; an empty array if value is null/undefined; otherwise value wrapped in an array.
 */
export function toArray<T>(value: T | T[] | undefined): T[] {
    if (ArrayIsArray(value)) {
        return value;
    }
    // null or undefined
    if (value !== null && value !== undefined) {
        return [value];
    }
    return [];
}

/**
 * @param value The array to inspect.
 * @returns True if the array is non-empty and contains only non-empty strings.
 */
export function isArrayOfNonEmptyStrings(value: any[]): value is string[] {
    if (value.length === 0) {
        return false;
    }
    return value.every(v => isString(v) && v.trim().length > 0);
}

/**
 * @param value The array to dedupe
 * @returns An array without duplicates.
 */
export function dedupe<T extends string>(value: T[]): T[] {
    const result: { [key: string]: true } = {};
    for (let i = 0, len = value.length; i < len; i += 1) {
        result[value[i]] = true;
    }
    return ObjectKeys(result) as T[];
}

/**
 * @param source The array of string to filter
 * @param compare The array to filter against
 * @returns An array with values from source that do not exist in compare
 * If the "compare" array is empty, "source" array itself is returned, not a shallow copy
 */
export function difference(source: string[], compare: string[]): string[] {
    const { length: sourceLength } = source;
    const { length: compareLength } = compare;
    if (sourceLength === 0 || source === compare) {
        return [];
    }

    if (compareLength === 0) {
        return source;
    }

    // Put all the values from "compare" into a map
    // This should be faster than doing an indexOf for every string in source
    const map: {
        [key: string]: boolean;
    } = {};

    for (let i = 0; i < compareLength; i += 1) {
        map[compare[i]] = true;
    }

    const strings: string[] = [];
    for (let i = 0; i < sourceLength; i += 1) {
        const string = source[i];
        if (map[string] === undefined) {
            strings.push(string);
        }
    }
    return strings;
}
