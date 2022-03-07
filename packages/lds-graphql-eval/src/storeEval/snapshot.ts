import type { FulfilledSnapshot } from '@luvio/engine';

export const GRAPHQL_ROOT_KEY = `GraphQL::graphql`;

export function findIds(json: any): string[] {
    const entries: [string, unknown][] = Object.entries(json);
    let ids: string[] = [];

    for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        const key = entry[0];
        const value = entry[1];

        if (typeof value === 'object' && value !== null) {
            const childIds = findIds(value);
            ids.push(...childIds);
        } else if (key === 'Id' && typeof value === 'string') {
            ids.push(value);
        }
    }

    return ids;
}

export function idWithPrefix(id: string): string {
    return `UiApi::RecordRepresentation:${id}`;
}

export type IdMap = Record<string, true>;

export function createSeenRecords(json: any): IdMap {
    const ids = findIds(json)
        .map(idWithPrefix)
        .reduce<IdMap>((acc, curr) => ((acc[curr] = true), acc), {});

    return ids;
}

export function createFulfilledSnapshot<D>(
    data: D,
    seenRecords: IdMap
): FulfilledSnapshot<D, unknown> {
    return {
        recordId: GRAPHQL_ROOT_KEY,
        variables: {},
        seenRecords,
        select: {
            recordId: GRAPHQL_ROOT_KEY,
            variables: {},
            node: {
                kind: 'Fragment',
                private: [],
            },
        },
        state: 'Fulfilled' as FulfilledSnapshot<D, unknown>['state'],
        data,
    };
}
