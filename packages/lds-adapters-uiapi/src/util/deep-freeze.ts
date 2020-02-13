import { ObjectFreeze, ArrayIsArray, ObjectKeys } from './language';

export function deepFreeze<U extends { [key: string]: any }>(value: U) {
    // No need to freeze primitives
    if (typeof value !== 'object' || value === null) {
        return;
    }
    if (ArrayIsArray(value)) {
        for (let i = 0, len = value.length; i < len; i += 1) {
            deepFreeze(value[i]);
        }
    } else {
        const keys = ObjectKeys(value);
        for (let i = 0, len = keys.length; i < len; i += 1) {
            deepFreeze(value[keys[i]]);
        }
    }
    ObjectFreeze(value);
}
