import type {
    Adapter,
    AdapterRequestContext,
    FetchResponse,
    Luvio,
    Snapshot,
    StaleSnapshot,
    UnfulfilledSnapshot,
    Unsubscribe,
} from '@luvio/engine';
import type { AdapterMetadata } from './ldsAdapter';
import { ObjectDefineProperty } from './utils/lanugage';
import { isErrorSnapshot, isPendingSnapshot } from './utils/snapshotType';
import { isPromise } from './utils/utils';

interface DataResponse<D> {
    data: D;
    error: undefined;
}

interface ErrorResponse {
    data: undefined;
    error: FetchResponse<unknown>;
}

export type DataCallbackTuple<D> = DataResponse<D> | ErrorResponse;

export type CallbackSnapshot<D> = Exclude<Snapshot<D>, UnfulfilledSnapshot<D> | StaleSnapshot<D>>;

export interface DataCallback<D> {
    (response: DataCallbackTuple<D>): void;
}

type ImperativeAdapterInvokeType<C, D> = (
    config: C,
    context: AdapterRequestContext,
    callback: DataCallback<D>
) => void;

type ImperativeAdapterSubscribeType<C, D> = (
    config: C,
    context: AdapterRequestContext,
    callback: DataCallback<D>
) => Unsubscribe;

export interface ImperativeAdapter<C, D> {
    invoke: ImperativeAdapterInvokeType<C, D>;
    subscribe: ImperativeAdapterSubscribeType<C, D>;
}

function snapshotToTuple<D>(snapshot: CallbackSnapshot<D>): DataCallbackTuple<D> {
    if (isErrorSnapshot(snapshot)) {
        return {
            data: undefined,
            error: snapshot.error,
        };
    }

    // We might still get pending snapshot here from invoke calls here
    return {
        data: snapshot.data!,
        error: undefined,
    };
}

function createInvalidConfigError(): ErrorResponse {
    return {
        data: undefined,
        error: {
            ok: false,
            status: 400,
            statusText: 'INVALID_CONFIG',
            body: undefined,
            headers: {},
        },
    };
}

/**
 * Creates an imperative adapter
 *
 * @param luvio Luvio
 * @param adapter luvio adapter
 * @param metadata AdapterMetadata
 * @returns Imperative adapter object with invoke and subscribe functions
 */
export function createImperativeAdapter<C, D>(
    luvio: Luvio,
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): ImperativeAdapter<C, D> {
    const { name } = metadata;

    const imperativeAdapterInvoke: ImperativeAdapterInvokeType<C, D> = (
        config: C,
        requestContext: AdapterRequestContext,
        callback: DataCallback<D>
    ) => {
        const snapshotOrPromise = adapter(config, requestContext) as
            | CallbackSnapshot<D>
            | Promise<CallbackSnapshot<D>>
            | null;

        if (snapshotOrPromise === null) {
            callback(createInvalidConfigError());
            return;
        }

        if (!isPromise(snapshotOrPromise)) {
            callback(snapshotToTuple(snapshotOrPromise));
            return;
        }

        snapshotOrPromise.then((snapshot: CallbackSnapshot<D>) => {
            if (snapshot === null) {
                callback(createInvalidConfigError());
                return;
            }
            callback(snapshotToTuple(snapshot));
        });
    };

    ObjectDefineProperty(imperativeAdapterInvoke, 'name', {
        value: `${name}_invoke`,
    });

    // Invokes the adapter and subscribes to the received snapshot
    // Returns an unsubscribe function to the consumer
    const imperativeAdapterSubscribe: ImperativeAdapterSubscribeType<C, D> = (
        config: C,
        requestContext: AdapterRequestContext,
        callback: DataCallback<D>
    ) => {
        let subscriberCallback: DataCallback<D> | null = callback;
        let unsub: Unsubscribe | undefined;

        const snapshotOrPromise = adapter(config, requestContext) as
            | CallbackSnapshot<D>
            | Promise<CallbackSnapshot<D>>
            | null;

        if (snapshotOrPromise === null) {
            subscriberCallback(createInvalidConfigError());
            return () => {};
        }

        // Can rebuild lead to pending snapshots?
        const luvioStoreSubscribe = (snapshot: CallbackSnapshot<D>) => {
            unsub = luvio.storeSubscribe(snapshot, (snapshotFromRebuild: Snapshot<D>) => {
                if (subscriberCallback !== null && !isPendingSnapshot(snapshotFromRebuild)) {
                    subscriberCallback(snapshotToTuple(snapshotFromRebuild as CallbackSnapshot<D>));
                }
            });
        };

        if (!isPromise(snapshotOrPromise)) {
            // We don't want to return pending snapshots to user-land
            // Instead we just subscribe to it
            if (!isPendingSnapshot(snapshotOrPromise)) {
                subscriberCallback(snapshotToTuple(snapshotOrPromise));
            }
            luvioStoreSubscribe(snapshotOrPromise);
        } else {
            snapshotOrPromise.then((snapshot: CallbackSnapshot<D>) => {
                if (subscriberCallback !== null) {
                    if (snapshot === null) {
                        subscriberCallback(createInvalidConfigError());
                        return;
                    }

                    // We don't want to return pending snapshots to user-land
                    // Instead we just subscribe to it
                    if (!isPendingSnapshot(snapshot)) {
                        subscriberCallback(snapshotToTuple(snapshot));
                    }

                    luvioStoreSubscribe(snapshot);
                }
            });
        }

        return () => {
            if (subscriberCallback !== null && unsub !== undefined) {
                unsub();
            }
            subscriberCallback = null;
            unsub = undefined;
        };
    };

    ObjectDefineProperty(imperativeAdapterSubscribe, 'name', {
        value: `${name}_subscribe`,
    });

    return {
        invoke: imperativeAdapterInvoke,
        subscribe: imperativeAdapterSubscribe,
    };
}
