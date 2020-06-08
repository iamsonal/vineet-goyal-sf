import { ArrayIsArray } from '../../util/language';
import toSortedStringArray from '../SortedStringArray/coerce';

export default function toSortedStringArrayAllowEmpty(value: unknown): Array<string> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];

    if (valueArray.length === 0) {
        return valueArray;
    }

    return toSortedStringArray(valueArray);
}
