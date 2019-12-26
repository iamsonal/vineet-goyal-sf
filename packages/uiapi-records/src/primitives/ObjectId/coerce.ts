import { isObjectId } from './index';

/**
 * Returns the object API name.
 * @param value The value from which to get the object API name.
 * @returns The object API name.
 */
export default function getObjectApiName(value: unknown): string | undefined {
    // Note: tightening validation logic changes behavior from userland getting
    // a server-provided error to the adapter noop'ing. In 224 we decided to not
    // change the behavior.
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    } else if (isObjectId(value)) {
        return value.objectApiName.trim();
    }

    return undefined;
}
