import { Adapter, Snapshot } from '@luvio/engine';
import { AdapterMetadata } from './ldsAdapter';
import { isErrorSnapshot } from './utils/snapshotType';
import { isPromise } from './utils/utils';

export interface Tuple {
    data: unknown;
    error: unknown;
}

export interface Error {
    code: number;
    message: unknown;
}

export interface DataCallback {
    (response: Tuple | Error): void;
}

export interface SingleInvocationAdapter<C> {
    (callback: DataCallback, config: C): void;
}

function snapshotToTuple<D>(snapshot: Snapshot<D>): Tuple {
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

function createInvalidConfigError(adapterName: string): Error {
    return {
        code: 199,
        message: `Adapter: ${adapterName} called with invalid config`,
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
): SingleInvocationAdapter<C> {
    const { name } = metadata;

    const singleInvocationAdapter: SingleInvocationAdapter<C> = (
        callback: DataCallback,
        config: C
    ) => {
        const snapshotOrPromise = adapter(config);

        if (snapshotOrPromise === null) {
            callback(createInvalidConfigError(name));
            return;
        }

        if (!isPromise(snapshotOrPromise)) {
            callback(snapshotToTuple(snapshotOrPromise));
            return;
        }

        snapshotOrPromise.then((_snapshot: Snapshot<D>) => {
            if (_snapshot === null) {
                callback(createInvalidConfigError(name));
                return;
            }
            callback(snapshotToTuple(_snapshot));
        });
    };

    Object.defineProperty(singleInvocationAdapter, 'name', {
        value: name,
    });

    return singleInvocationAdapter;
}
