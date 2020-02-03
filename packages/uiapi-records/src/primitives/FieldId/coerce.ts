import { isString } from '../../validation/utils';
import { isFieldId } from './index';

/**
 * Returns the field API name, qualified with an object name if possible.
 * @param value The value from which to get the qualified field API name.
 * @return The qualified field API name.
 */
export default function getFieldApiName(value: unknown): string | undefined {
    // Note: tightening validation logic changes behavior from userland getting
    // a server-provided error to the adapter noop'ing. In 224 we decided to not
    // change the behavior.
    if (isString(value)) {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    } else if (isFieldId(value)) {
        return value.objectApiName + '.' + value.fieldApiName;
    }
    return undefined;
}
