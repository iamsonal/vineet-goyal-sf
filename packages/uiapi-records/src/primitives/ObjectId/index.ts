export interface ObjectId {
    objectApiName: string;
}

export function isObjectId(unknown: unknown): unknown is ObjectId {
    if (typeof unknown !== 'object' || unknown === null) {
        return false;
    }

    return 'objectApiName' in unknown;
}
