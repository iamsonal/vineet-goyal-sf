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
} from '@luvio/engine';
import {
    AdapterValidationConfig,
    snapshotRefreshOptions,
    stableJSONStringify,
} from '../../generated/adapters/adapter-utils';
import {
    createResourceRequest,
    ResourceRequestConfig,
} from '../../generated/resources/getByApexMethodAndApexClass';
import { ObjectCreate } from '../../util/language';
import {
    apexResponseIngest,
    apexClassnameBuilder,
    ApexAdapterConfig,
    ApexInvokerParams,
    configBuilder,
    keyBuilder,
    KEY_DELIM,
    isEmptyParam,
    setCacheControlAdapterContext,
    SHARED_ADAPTER_CONTEXT_ID,
    shouldCache,
    validateAdapterConfig,
    BuildSnapshotContext,
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
    const queryParams = ObjectCreate(null);
    if (!isEmptyParam(config.methodParams)) {
        queryParams.methodParams = config.methodParams;
    }
    return {
        queryParams,
        urlParams: {
            apexMethod: config.apexMethod,
            apexClass: config.apexClass,
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

function buildInMemorySnapshotCachePolicy(
    buildSnapshotContext: BuildSnapshotContext,
    storeLookup: StoreLookup<any>
): Snapshot<any, any> {
    const { luvio, config, adapterContext } = buildSnapshotContext;

    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return storeLookup(
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
            resolve: () =>
                buildNetworkSnapshot(luvio, adapterContext, config, snapshotRefreshOptions),
        }
    );
}

export function onResourceResponseSuccess(
    luvio: Luvio,
    context: AdapterContext,
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
    setCacheControlAdapterContext(context, recordId, response);
    if (shouldCache(response)) {
        const snapshot = ingestSuccess(luvio, resourceParams, response, {
            config,
            resolve: () => buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
        });
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
    context: AdapterContext,
    config: ApexAdapterConfig,
    _resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(response, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
    });
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
    return luvio.withContext(
        function apex__getApex(
            untrustedConfig: unknown,
            context: AdapterContext,
            requestContext?: AdapterRequestContext
        ): Promise<Snapshot<any, any>> | Snapshot<any, any> | null {
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

            return luvio.applyCachePolicy<BuildSnapshotContext, any>(
                requestContext || {},
                { config: configPlus, luvio, adapterContext: context },
                buildInMemorySnapshotCachePolicy,
                buildNetworkSnapshotCachePolicy
            );
        },
        { contextId: SHARED_ADAPTER_CONTEXT_ID }
    );
}
