import { ErrorSnapshot, Snapshot } from '@luvio/engine';

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
