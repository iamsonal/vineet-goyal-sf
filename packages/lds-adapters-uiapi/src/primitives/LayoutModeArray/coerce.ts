import type { LayoutMode } from '../LayoutMode';
import getLayoutMode from '../LayoutMode/coerce';
import { ArrayIsArray, ArrayPrototypePush } from '../../util/language';
import { dedupe } from '../../validation/utils';

export default function coerceLayoutModeArray(value: unknown): Array<LayoutMode> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];
    const array: LayoutMode[] = [];

    for (let i = 0, len = valueArray.length; i < len; i += 1) {
        const item: unknown = valueArray[i];
        const apiName = getLayoutMode(item);
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
