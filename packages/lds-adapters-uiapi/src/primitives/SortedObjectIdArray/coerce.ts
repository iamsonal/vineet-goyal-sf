import coerce from '../ObjectIdArray/coerce';

/**
 * Returns the object API name.
 * @param value The value from which to get the object API name.
 * @returns The object API name.
 */
export default function getSortedObjectApiNamesArray(value: unknown): Array<string> | undefined {
    const unsortedArray = coerce(value);
    return unsortedArray === undefined ? undefined : unsortedArray.sort();
}
