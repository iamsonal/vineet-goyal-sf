import getFieldApiName from '../FieldId/coerce';
import { ArrayPrototypePush, ArrayIsArray } from '../../util/language';
import { dedupe } from '../../validation/utils';

/**
 * Returns the field API name.
 * @param value The value from which to get the field API name.
 * @returns The field API name.
 */
export default function getFieldApiNamesArray(value: unknown): Array<string> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];
    const array: string[] = [];

    for (let i = 0, len = valueArray.length; i < len; i += 1) {
        const item: unknown = valueArray[i];
        const apiName = getFieldApiName(item);
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
