import type {
    FulfilledSnapshot,
    StaleSnapshot,
    StoreMetadata,
    TTLStrategy,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import { StoreResolveResultState } from '@luvio/engine';

import { isObject } from './util';
const GRAPHQL_ROOT_KEY = `GraphQL::graphql`;

export enum SnapshotState {
    Fulfilled = 'Fulfilled',
    Unfulfilled = 'Unfulfilled',
    Error = 'Error',
    Pending = 'Pending',
    Stale = 'Stale',
}

function isMetadata(obj: unknown): obj is StoreMetadata {
    return (
        isObject(obj) &&
        'expirationTimestamp' in obj &&
        'namespace' in obj &&
        'representationName' in obj &&
        'ingestionTimestamp' in obj
    );
}

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

type IdMap = { [key: string]: true };
export function createSeenRecords(json: any): IdMap {
    const ids = findIds(json)
        .map(idWithPrefix)
        .reduce<IdMap>((acc, curr) => ((acc[curr] = true), acc), {});

    return ids;
}

export function snapshotStateFromTTL(
    metadata: StoreMetadata[],
    ttlStrategy: TTLStrategy,
    timestamp: number
): SnapshotState.Fulfilled | SnapshotState.Unfulfilled | SnapshotState.Stale {
    const states = metadata.map((md) => ttlStrategy(timestamp, md, false));

    if (states.indexOf(StoreResolveResultState.NotPresent) !== -1) {
        return SnapshotState.Unfulfilled;
    }

    if (states.indexOf(StoreResolveResultState.Stale) !== -1) {
        return SnapshotState.Stale;
    }

    return SnapshotState.Fulfilled;
}

export function findMetadata(json: any): StoreMetadata[] {
    const entries: [string, unknown][] = Object.entries(json);
    let values: StoreMetadata[] = [];

    for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        const key = entry[0];
        const value = entry[1];

        if (typeof value === 'object' && value !== null) {
            if (key === '_metadata' && isMetadata(value)) {
                values.push(value);
            } else {
                const childIds = findMetadata(value);
                values.push(...childIds);
            }
        }
    }

    return values;
}

export type EvalSnapshot =
    | FulfilledSnapshot<unknown>
    | StaleSnapshot<unknown>
    | UnfulfilledSnapshot<unknown>;
export function createSnapshot(
    json: any,
    ttlStrategy: TTLStrategy,
    timestamp: number
): EvalSnapshot {
    const seenRecords = createSeenRecords(json);
    const metadata = findMetadata(json);
    const state = snapshotStateFromTTL(metadata, ttlStrategy, timestamp);

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
        missingLinks: {},
        missingPaths: {},
        state,
        data: json,
    };
}
