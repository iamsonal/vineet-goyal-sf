import { JSONParse, JSONStringify } from './language';

export function clone<T>(obj: T): T {
    return JSONParse(JSONStringify(obj));
}
