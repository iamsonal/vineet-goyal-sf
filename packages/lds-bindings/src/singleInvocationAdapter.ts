import { Adapter, AvailableSnapshot, FetchResponse } from '@luvio/engine';
import { AdapterMetadata } from './ldsAdapter';
import { ObjectDefineProperty } from './utils/lanugage';
import { isErrorSnapshot } from './utils/snapshotType';
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

export interface DataCallback<D> {
    (response: DataCallbackTuple<D>): void;
}

export interface SingleInvocationAdapter<C, D> {
    (callback: DataCallback<D>, config: C): void;
}

function snapshotToTuple<D>(snapshot: AvailableSnapshot<D>): DataCallbackTuple<D> {
    if (isErrorSnapshot(snapshot)) {
        return {
            data: undefined,
            error: snapshot.error,
        };
    }

    return {
        data: snapshot.data,
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
 * Creates a single invocation adapter
 *
 * @param adapter - luvio adapter
 * @param metadata - AdapterMetadata
 * @returns Single invocation adapter that accepts a callback, config
 */
export function createSingleInvocationAdapter<C, D>(
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): SingleInvocationAdapter<C, D> {
    const { name } = metadata;

    const singleInvocationAdapter: SingleInvocationAdapter<C, D> = (
        callback: DataCallback<D>,
        config: C
    ) => {
        const snapshotOrPromise = adapter(config) as AvailableSnapshot<D>;

        if (snapshotOrPromise === null) {
            callback(createInvalidConfigError());
            return;
        }

        if (!isPromise(snapshotOrPromise)) {
            callback(snapshotToTuple(snapshotOrPromise));
            return;
        }

        snapshotOrPromise.then((_snapshot: AvailableSnapshot<D>) => {
            if (_snapshot === null) {
                callback(createInvalidConfigError());
                return;
            }
            callback(snapshotToTuple(_snapshot));
        });
    };

    ObjectDefineProperty(singleInvocationAdapter, 'name', {
        value: name,
    });

    return singleInvocationAdapter;
}
