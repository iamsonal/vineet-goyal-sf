import getRecordId18 from '../RecordId18/coerce';
import { ArrayPrototypePush, ArrayIsArray } from '../../util/language';
import { dedupe } from '../../validation/utils';

/**
 * Returns the object API name.
 * @param value The value from which to get the object API name.
 * @returns The object API name.
 */
export default function getRecordId18Array(value: unknown): Array<string> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];
    const array: string[] = [];

    for (let i = 0, len = valueArray.length; i < len; i += 1) {
        const item: unknown = valueArray[i];
        const apiName = getRecordId18(item);
        if (apiName === undefined) {
            return undefined;
        }

        ArrayPrototypePush.call(array, apiName);
    }

    if (array.length === 0) {
        return undefined;
    }

    return dedupe(array).sort();
}
