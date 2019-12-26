import { isArrayOfNonEmptyStrings, dedupe } from '../../validation/utils';
import { ArrayIsArray } from '../../util/language';

export default function toSortedStringArray(value: unknown): Array<string> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];

    if (valueArray.length !== 0 && isArrayOfNonEmptyStrings(valueArray)) {
        return dedupe(valueArray).sort();
    }

    return undefined;
}
