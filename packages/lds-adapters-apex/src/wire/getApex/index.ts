import {
    Adapter,
    FetchResponse,
    FulfilledSnapshot,
    Luvio,
    ResourceRequestOverride,
    ResourceResponse,
    Selector,
    Snapshot,
    SnapshotRefresh,
    StaleSnapshot,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import {
    AdapterValidationConfig,
    snapshotRefreshOptions,
    SNAPSHOT_STATE_UNFULFILLED,
    stableJSONStringify,
} from '../../generated/adapters/adapter-utils';
import {
    createResourceRequest,
    ResourceRequestConfig,
} from '../../generated/resources/getByApexMethodAndApexClass';
import {
    apexResponseIngest,
    apexClassnameBuilder,
    ApexAdapterConfig,
    ApexInvokerParams,
    configBuilder,
    keyBuilder,
    KEY_DELIM,
    isEmptyParam,
    shouldCache,
    validateAdapterConfig,
} from '../../util/shared';

export const adapterName = 'getByApexMethodAndApexClass';

export const getByApexMethodAndApexClass_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getByApexMethodAndApexClass',
    parameters: {
        required: ['apexMethod', 'apexClass'],
        optional: ['methodParams', 'xSFDCAllowContinuation'],
    },
};

export function createResourceParams(config: ApexAdapterConfig): ResourceRequestConfig {
    return {
        urlParams: {
            apexMethod: config.apexMethod,
            apexClass: config.apexClass,
        },
        queryParams: {
            methodParams: config.methodParams,
        },
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
        isEmptyParam(params.queryParams.methodParams)
            ? ''
            : stableJSONStringify(params.queryParams.methodParams),
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
    luvio.storePublish(recordId + '_cacheable', response.headers);
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

function buildInMemorySnapshot(luvio: Luvio, config: ApexAdapterConfig) {
    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return luvio.storeLookup<any>(
        {
            recordId: recordId,
            node: {
                kind: 'Fragment',
                opaque: true,
                private: [],
            },
            variables: {},
        },
        {
            config,
            resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
        }
    );
}

export function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: ApexAdapterConfig,
    snapshot: UnfulfilledSnapshot<any, unknown>
): Promise<any> {
    const params = createResourceParams(config);
    const request = createResourceRequest(params);
    return luvio.resolveUnfulfilledSnapshot<any>(request, snapshot).then(
        (response) => {
            return onResourceResponseSuccess(luvio, config, params, response);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, params, error);
        }
    );
}

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: ApexAdapterConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<any>
) {
    const recordId = keyBuilderFromResourceParams(resourceParams);
    const select: Selector<any> = {
        recordId,
        node: { kind: 'Fragment', opaque: true, private: [] },
        variables: {},
    };
    if (shouldCache(response)) {
        const snapshot = ingestSuccess(luvio, resourceParams, response, {
            config,
            resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
        });
        luvio.storeBroadcast();
        return snapshot;
    }

    // if cacheable is not set or set to false, return a synthetic snapshot
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
    config: ApexAdapterConfig,
    _resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(response, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    });
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: ApexAdapterConfig,
    override?: ResourceRequestOverride
): Promise<Snapshot<any>> {
    const resourceParams = createResourceParams(config);
    const request = createResourceRequest(resourceParams);
    return luvio.dispatchResourceRequest<any>(request, override).then(
        (response) => {
            return onResourceResponseSuccess(luvio, config, resourceParams, response);
        },
        (response: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, resourceParams, response);
        }
    );
}

export const factory = (luvio: Luvio, invokerParams: ApexInvokerParams): Adapter<any, any> => {
    const { namespace, classname, method, isContinuation } = invokerParams;
    return getApexAdapterFactory(luvio, namespace, classname, method, isContinuation);
};

function getApexAdapterFactory(
    luvio: Luvio,
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
): Adapter<any, any> {
    return (untrustedConfig: unknown) => {
        // Even though the config is of type `any`,
        // validation is required here because `undefined`
        // values on a wire mean that properties on the component
        // used in the config have not been loaded yet.
        const config = validateAdapterConfig(untrustedConfig);

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }
        const configPlus = configBuilder(
            config,
            apexClassnameBuilder(namespace, classname),
            method,
            isContinuation
        );

        const cacheSnapshot = buildInMemorySnapshot(luvio, configPlus);

        // Cache Hit
        if (luvio.snapshotAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        if (cacheSnapshot.state === SNAPSHOT_STATE_UNFULFILLED) {
            return resolveUnfulfilledSnapshot(luvio, configPlus, cacheSnapshot);
        }

        return buildNetworkSnapshot(luvio, configPlus);
    };
}
