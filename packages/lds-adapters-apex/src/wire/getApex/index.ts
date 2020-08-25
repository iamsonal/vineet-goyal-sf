import {
    Adapter,
    FulfilledSnapshot,
    IngestPath,
    LDS,
    ResourceIngest,
    Selector,
    Snapshot,
    FetchResponse,
} from '@ldsjs/engine';
import { stableJSONStringify } from '../../util/utils';
import { default as getApexRequest } from '../../generated/resources/postApex';
import { refreshable, untrustedIsObject } from '../../generated/adapters/adapter-utils';
import { deepFreeze, createLink } from '../../generated/types/type-utils';
import { JSONStringify, ObjectKeys, ObjectValues } from '../../util/language';

interface ApexScopedModuleParams {
    namespace: string;
    classname: string;
    method: string;
}

interface ApexInvokerParams extends ApexScopedModuleParams {
    isContinuation: boolean;
}

function cache(
    lds: LDS,
    config: unknown,
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
): Snapshot<any> | null {
    const recordId = getApexId(namespace, classname, method, isContinuation, config);
    const cacheableSnap = lds.storeLookup<{ cacheable: boolean }>({
        recordId: recordId + '_cacheable',
        node: {
            kind: 'Fragment',
            private: [],
            selections: [
                {
                    kind: 'Scalar',
                    name: 'cacheable',
                },
            ],
        },
        variables: {},
    });

    // adapter always storeIngest the response, but only cacheable response should be used
    if (cacheableSnap.state !== 'Fulfilled' || cacheableSnap.data.cacheable === false) {
        return null;
    }

    const snap = lds.storeLookup<any>({
        recordId,
        node: { kind: 'Fragment', opaque: true, private: [] },
        variables: {},
    });

    if (snap.state !== 'Fulfilled') {
        return null;
    }
    return snap;
}

// TODO: APEX_TTL, apexResponseEquals, apexResponseIngest, and validateAdapterConfig should have been code generated
// however compiler does not support response body type any so hand roll for now
/**
 * Time to live for the Apex cache value. 5 minutes.
 */
const APEX_TTL = 5 * 60 * 1000;

function apexResponseEquals(existing: any, incoming: any): boolean {
    return JSONStringify(incoming) === JSONStringify(existing);
}

const apexResponseIngest: ResourceIngest = (
    input: any,
    path: IngestPath,
    _lds: any,
    store: any,
    timestamp: number
) => {
    // skip validation since input type is any

    const key = path.fullPath;

    const existingRecord = store.records[key];

    // no normalization
    let incomingRecord = input;

    deepFreeze(input);

    if (
        existingRecord === undefined ||
        apexResponseEquals(existingRecord, incomingRecord) === false
    ) {
        store.publish(key, incomingRecord);
    }

    store.setExpiration(key, timestamp + APEX_TTL);

    return createLink(key);
};

/**
 *  Validates the apex request configuration passed in from @wire.
 *  @param config The configuration object passed from @wire.
 *  @returns True if config is null/undefined or false if it does not contain undefined values.
 */
export function validateAdapterConfig(untrustedConfig?: unknown): boolean {
    if (untrustedIsObject(untrustedConfig)) {
        const values = ObjectValues(untrustedConfig);
        return values.indexOf(undefined) === -1;
    }

    return true;
}

function network(
    lds: LDS,
    config: any,
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean,
    cacheable: boolean
): Promise<Snapshot<any>> {
    const recordId = getApexId(namespace, classname, method, isContinuation, config);
    const select: Selector<any> = {
        recordId,
        node: { kind: 'Fragment', opaque: true, private: [] },
        variables: {},
    };
    const body = {
        namespace,
        classname,
        method,
        isContinuation,
        params: config,
        cacheable,
    };
    const requestConfig = { body };

    const request = {
        ...getApexRequest(requestConfig),
        ingest: apexResponseIngest,
    };

    return lds.dispatchResourceRequest<any>(request).then(
        resp => {
            const { cacheable } = resp.headers;
            if (((cacheable as unknown) as boolean) === true) {
                lds.storePublish(recordId + '_cacheable', resp.headers);
                lds.storeIngest(recordId, request.ingest, resp.body);
                lds.storeBroadcast();

                return lds.storeLookup<any>(select);
            }

            // if cacheable is not set or set to false, return a synthetic snapshot
            return {
                recordId,
                variables: {},
                seenRecords: {},
                select,
                state: 'Fulfilled',
                data: resp.body,
            } as FulfilledSnapshot<any, any>;
        },
        (err: FetchResponse<unknown>) => {
            return lds.errorSnapshot(err);
        }
    );
}

export const factory = (lds: LDS, invokerParams: ApexInvokerParams): Adapter<any, any> => {
    const { namespace, classname, method, isContinuation } = invokerParams;
    const adapter = getLdsAdapterFactory(lds, namespace, classname, method, isContinuation, true);

    return refreshable<any, any, any>(
        function apexWireAdapter(untrustedConfig: unknown) {
            // Invalid or incomplete config
            if (!validateAdapterConfig(untrustedConfig)) {
                return null;
            }

            return adapter(untrustedConfig);
        },

        (untrustedConfig: unknown) => {
            // This should never happen
            if (!validateAdapterConfig(untrustedConfig)) {
                throw new Error('Invalid config passed to "apexWireAdapter" refresh function');
            }

            return network(
                lds,
                untrustedConfig,
                namespace,
                classname,
                method,
                isContinuation,
                true
            );
        }
    );
};

export const invoker = (lds: LDS, invokerParams: ApexInvokerParams) => {
    const { namespace, classname, method, isContinuation } = invokerParams;
    const ldsAdapter = getLdsAdapterFactory(
        lds,
        namespace,
        classname,
        method,
        isContinuation,
        false
    );
    return getInvoker(ldsAdapter);
};

function getInvoker(ldsAdapter: Adapter<any, any>) {
    return (config: unknown) => {
        const snapshotOrPromise = ldsAdapter(config);
        return Promise.resolve(snapshotOrPromise!).then((snapshot: Snapshot<any>) => {
            if (snapshot.state === 'Error') {
                throw snapshot.error;
            }
            return snapshot.data!;
        });
    };
}

/**
 * A standard delimiter when producing cache keys.
 */
const KEY_DELIM = ':';

function isEmptyParam(param: unknown): boolean {
    return (
        param === undefined ||
        param === null ||
        (typeof param === 'object' && ObjectKeys(param!).length === 0)
    );
}

/**
 * Constructs a cache key for the Apex value type.
 * @param namespace The name space.
 * @param classname The class name.
 * @param functionName The function name.
 * @param isContinuation Indicates whether the Apex method returns a continuation.
 * @param params The params.
 * @returns A new cache key representing the Apex value type.
 */
export function getApexId(
    namespace: string | null,
    classname: string,
    functionName: string,
    isContinuation: boolean,
    params: unknown
): string {
    return [
        namespace,
        classname,
        functionName,
        isContinuation,
        isEmptyParam(params) ? '' : stableJSONStringify(params),
    ].join(`${KEY_DELIM}`);
}

function getLdsAdapterFactory(
    lds: LDS,
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean,
    cacheable: boolean
): Adapter<any, any> {
    return (config: unknown) => {
        const snap = cache(lds, config, namespace, classname, method, isContinuation);
        if (snap !== null) {
            return snap;
        }
        return network(lds, config, namespace, classname, method, isContinuation, cacheable);
    };
}
