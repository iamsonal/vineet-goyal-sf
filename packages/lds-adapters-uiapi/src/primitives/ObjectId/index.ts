import { isString } from '../../validation/utils';

export interface ObjectId {
    objectApiName: string;
}

export function isObjectId(unknown: unknown): unknown is ObjectId {
    if (typeof unknown !== 'object' || unknown === null) {
        return false;
    }

    return isString((unknown as any).objectApiName);
}
