import type { ErrorSnapshot, PendingSnapshot, Snapshot } from '@luvio/engine';

enum SnapshotState {
    Fulfilled = 'Fulfilled',
    Unfulfilled = 'Unfulfilled',
    Error = 'Error',
    Pending = 'Pending',
    Stale = 'Stale',
}

export function isErrorSnapshot(snapshot: Snapshot<unknown, unknown>): snapshot is ErrorSnapshot {
    return snapshot.state === SnapshotState.Error;
}

export function isPendingSnapshot<D>(
    snapshot: Snapshot<D, unknown>
): snapshot is PendingSnapshot<D> {
    return snapshot.state === SnapshotState.Pending;
}
