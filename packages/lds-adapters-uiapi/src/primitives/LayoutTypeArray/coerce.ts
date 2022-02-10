import getLayoutType from '../LayoutType/coerce';
import type { LayoutType } from '../LayoutType';
import { ArrayPrototypePush, ArrayIsArray } from '../../util/language';
import { dedupe } from '../../validation/utils';

export default function getLayoutTypeArray(value: unknown): Array<LayoutType> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];
    const array: LayoutType[] = [];

    for (let i = 0, len = valueArray.length; i < len; i += 1) {
        const item: unknown = valueArray[i];
        const apiName = getLayoutType(item);
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
