import {
    Adapter,
    AdapterContext,
    AdapterRequestContext,
    FetchResponse,
    FulfilledSnapshot,
    Luvio,
    ResourceRequestOverride,
    ResourceResponse,
    Selector,
    Snapshot,
    SnapshotRefresh,
    StaleSnapshot,
    StoreLookup,
    UnAvailableSnapshot,
} from '@luvio/engine';
import { stableJSONStringify } from '../../util/utils';
import {
    createResourceRequest,
    ResourceRequestConfig,
} from '../../generated/resources/postByApexMethodAndApexClass';
import {
    apexResponseIngest,
    apexClassnameBuilder,
    ApexAdapterConfig,
    ApexInvokerParams,
    configBuilder,
    keyBuilder,
    KEY_DELIM,
    isCacheable,
    isEmptyParam,
    setCacheControlAdapterContext,
    shouldCache,
    SHARED_ADAPTER_CONTEXT_ID,
    BuildSnapshotContext,
} from '../../util/shared';

export function createResourceParams(config: ApexAdapterConfig): ResourceRequestConfig {
    return {
        urlParams: {
            apexMethod: config.apexMethod,
            apexClass: config.apexClass,
        },
        body: config.methodParams,
        headers: {
            xSFDCAllowContinuation: config.xSFDCAllowContinuation,
        },
    };
}

export function keyBuilderFromResourceParams(params: ResourceRequestConfig): string {
    let classname = params.urlParams.apexClass.replace('__', KEY_DELIM);
    return [
        classname,
        params.urlParams.apexMethod,
        params.headers.xSFDCAllowContinuation,
        isEmptyParam(params.body) ? '' : stableJSONStringify(params.body),
    ].join(KEY_DELIM);
}

export function ingestSuccess(
    luvio: Luvio,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<any>,
    snapshotRefresh?: SnapshotRefresh<any>
): FulfilledSnapshot<any, any> | StaleSnapshot<any, any> {
    const { body } = response;
    const recordId = keyBuilderFromResourceParams(resourceParams);
    const select: Selector<any> = {
        recordId,
        node: { kind: 'Fragment', opaque: true, private: [] },
        variables: {},
    };
    luvio.storeIngest<any>(recordId, apexResponseIngest, body);

    const snapshot = luvio.storeLookup<any>(select, snapshotRefresh);

    if (process.env.NODE_ENV !== 'production') {
        if (response.headers !== undefined && snapshot.state !== 'Fulfilled') {
            throw new Error(
                'Invalid network response. Expected resource response to result in Fulfilled snapshot'
            );
        }

        if (!(snapshot.state === 'Fulfilled' || snapshot.state === 'Stale')) {
            throw new Error(
                'Invalid resource response. Expected resource response to result in Fulfilled or Stale snapshot'
            );
        }
    }

    return snapshot as FulfilledSnapshot<any, any> | StaleSnapshot<any, any>;
}

function buildInMemorySnapshot(luvio: Luvio, _context: AdapterContext, config: ApexAdapterConfig) {
    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return luvio.storeLookup<any>({
        recordId: recordId,
        node: {
            kind: 'Fragment',
            opaque: true,
            private: [],
        },
        variables: {},
    });
}

function buildInMemorySnapshotCachePolicy(
    buildSnapshotContext: BuildSnapshotContext,
    storeLookup: StoreLookup<any>
) {
    const { config } = buildSnapshotContext;

    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return storeLookup({
        recordId: recordId,
        node: {
            kind: 'Fragment',
            opaque: true,
            private: [],
        },
        variables: {},
    });
}

export function onResourceResponseSuccess(
    luvio: Luvio,
    context: AdapterContext,
    _config: ApexAdapterConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<any>
) {
    const recordId = keyBuilderFromResourceParams(resourceParams);
    const select: Selector<any> = {
        recordId,
        node: { kind: 'Fragment', opaque: true, private: [] },
        variables: {},
    };
    setCacheControlAdapterContext(context, recordId, response);
    if (shouldCache(response)) {
        const snapshot = ingestSuccess(luvio, resourceParams, response);
        luvio.storeBroadcast();
        return snapshot;
    }

    // if Cache-Control is not set or set to 'no-cache', return a synthetic snapshot
    return {
        recordId,
        variables: {},
        seenRecords: {},
        select,
        state: 'Fulfilled',
        data: response.body,
    } as FulfilledSnapshot<any, any>;
}

export function onResourceResponseError(
    luvio: Luvio,
    _context: AdapterContext,
    _config: ApexAdapterConfig,
    _resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(response);
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    context: AdapterContext,
    config: ApexAdapterConfig,
    override?: ResourceRequestOverride
): Promise<Snapshot<any>> {
    const resourceParams = createResourceParams(config);
    const request = createResourceRequest(resourceParams);
    return luvio.dispatchResourceRequest<any>(request, override).then(
        (response) => {
            // TODO [W-10155026]: this should call luvio.handleSuccessResponse
            return onResourceResponseSuccess(luvio, context, config, resourceParams, response);
        },
        (response: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, context, config, resourceParams, response);
        }
    );
}

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext
): Promise<Snapshot<any, any>> {
    const { luvio, config, adapterContext } = context;
    return buildNetworkSnapshot(luvio, adapterContext, config);
}

export const invoker = (luvio: Luvio, invokerParams: ApexInvokerParams) => {
    const { namespace, classname, method, isContinuation } = invokerParams;
    const ldsAdapter = postApexAdapterFactory(luvio, namespace, classname, method, isContinuation);
    return getInvoker(ldsAdapter);
};

function getInvoker(ldsAdapter: Adapter<any, any>) {
    return (config: unknown, requestContext?: AdapterRequestContext) => {
        const snapshotOrPromise = ldsAdapter(config, requestContext);
        return Promise.resolve(snapshotOrPromise!).then((snapshot: Snapshot<any>) => {
            if (snapshot.state === 'Error') {
                throw snapshot.error;
            }
            return snapshot.data!;
        });
    };
}

function postApexAdapterFactory(
    luvio: Luvio,
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
): Adapter<any, any> {
    return luvio.withContext(
        function apex__postApex(
            config: unknown,
            context: AdapterContext,
            requestContext?: AdapterRequestContext
        ): Promise<Snapshot<any, any>> | Snapshot<any, any> {
            // config validation is unnecessary for this imperative adapter
            // due to the config being of type `any`.
            // however, we have special config validation for the wire adapter,
            // explanation in getApex
            const configPlus = configBuilder(
                config,
                apexClassnameBuilder(namespace, classname),
                method,
                isContinuation
            );

            // TODO [W-10164140]: this if block can go away and this adapter always calls
            // luvio.applyCachePolicy (if isCacheable is false we can pass a "cache-only"
            // cache-policy into it)
            if (requestContext === undefined) {
                if (isCacheable(configPlus, context)) {
                    const cacheSnapshot = buildInMemorySnapshot(luvio, context, configPlus);

                    // Cache Hit
                    if (luvio.snapshotAvailable(cacheSnapshot) === true) {
                        return cacheSnapshot;
                    }

                    // Resolve if snapshot not available
                    // we have to cast to AvailableSnapshot because TS doesn't know how to infer types after "=== true" on the previous line
                    return luvio.resolveSnapshot(cacheSnapshot as UnAvailableSnapshot<any, any>, {
                        config: {},
                        resolve: () => buildNetworkSnapshot(luvio, context, configPlus),
                    });
                }

                return buildNetworkSnapshot(luvio, context, configPlus);
            }

            return luvio.applyCachePolicy<BuildSnapshotContext, any>(
                (requestContext || {}).cachePolicy,
                { config: configPlus, luvio, adapterContext: context },
                buildInMemorySnapshotCachePolicy,
                buildNetworkSnapshotCachePolicy
            );
        },
        { contextId: SHARED_ADAPTER_CONTEXT_ID }
    );
}
