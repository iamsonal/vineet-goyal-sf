import {
    Snapshot,
    ErrorSnapshot,
    FulfilledSnapshot,
    UnfulfilledSnapshot,
    StaleSnapshot,
} from '@luvio/engine';

export function isFulfilledSnapshot<T, U>(
    snapshot: Snapshot<T, U>
): snapshot is FulfilledSnapshot<T, U> {
    return snapshot.state === 'Fulfilled';
}

export function isUnfulfilledSnapshot<T, U>(
    snapshot: Snapshot<T, U>
): snapshot is UnfulfilledSnapshot<T, U> {
    return snapshot.state === 'Unfulfilled';
}

export function isStaleSnapshot<T, U>(snapshot: Snapshot<any>): snapshot is StaleSnapshot<T, U> {
    return snapshot.state === 'Stale';
}

export function isErrorSnapshot(snapshot: Snapshot<any>): snapshot is ErrorSnapshot {
    return snapshot.state === 'Error';
}
