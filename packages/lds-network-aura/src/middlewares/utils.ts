import type { ActionConfig } from 'aura';
import { executeGlobalController } from 'aura';
import type { AuraStorage } from 'aura-storage';
import type { CacheStatsLogger } from 'instrumentation/service';
import { registerCacheStats } from 'instrumentation/service';

import type { FetchResponse, ResourceRequest } from '@luvio/engine';
import { HttpStatusCode } from '@luvio/engine';
import { AuraFetchResponse } from '../AuraFetchResponse';

import appRouter from '../router';

import { ObjectKeys } from '../utils/language';
import { instrumentation } from '../instrumentation';

export type ControllerInvoker = (
    resourceRequest: ResourceRequest,
    resourceKey: string
) => Promise<any>;

interface CacheConfig {
    storage: AuraStorage;
    key: string;
    statsLogger: CacheStatsLogger;
    forceRefresh?: boolean;
}

/**
 * Create a new instrumentation cache stats and return it.
 *
 * @param name The cache logger name.
 */
const NAMESPACE = 'lds';
export function registerLdsCacheStats(name: string): CacheStatsLogger {
    return registerCacheStats(`${NAMESPACE}:${name}`);
}

export interface DispatchActionConfig {
    action?: ActionConfig;
    cache?: CacheConfig;
}

interface UiApiClientOptions {
    ifModifiedSince?: string;
    ifUnmodifiedSince?: string;
}

export interface UiApiParams {
    [name: string]: any;
    clientOptions?: UiApiClientOptions;
}

interface UiApiBody {
    [name: string]: any;
}

interface UiApiError {
    errorCode: number;
    message: string;
}

interface ConnectInJavaError {
    data: {
        errorCode: string;
        message: string;
        statusCode: number;
    };
    id: string;
    message: string;
    stackTrace: string;
}

interface AuraAction {
    controller: string;
    action?: ActionConfig;
}

interface Adapter {
    method: string;
    predicate: (path: string) => boolean;
    transport: AuraAction;
}

export interface ApiFamily {
    [adapter: string]: Adapter;
}

interface InstrumentationConfig {
    params: UiApiParams;
}

export interface InstrumentationResolveConfig extends InstrumentationConfig {
    body: UiApiBody;
}

export interface InstrumentationRejectConfig extends InstrumentationConfig {
    err?: UiApiError | ConnectInJavaError;
}

const defaultActionConfig: ActionConfig = {
    background: false,
    hotspot: true,
    longRunning: false,
};

export type InstrumentationResolveCallback = (config: InstrumentationResolveConfig) => void;
export type InstrumentationRejectCallback = (config: InstrumentationRejectConfig) => void;

export interface InstrumentationCallbacks {
    rejectFn?: InstrumentationRejectCallback;
    resolveFn?: InstrumentationResolveCallback;
}

function createOkResponse(body: unknown): AuraFetchResponse<unknown> {
    return new AuraFetchResponse(HttpStatusCode.Ok, body);
}

type FetchFromNetwork = () => Promise<FetchResponse<unknown>>;
/**
 * Wraps the FetchFromNetwork function to provide instrumentation hooks
 * for network requests and responses.
 */
function instrumentFetchFromNetwork(fetchFromNetwork: FetchFromNetwork): FetchFromNetwork {
    return () => {
        instrumentation.networkRequest();
        return fetchFromNetwork()
            .then((response: FetchResponse<unknown>) => {
                instrumentation.networkResponse(() => response);
                return response;
            })
            .catch((response: FetchResponse<unknown>) => {
                instrumentation.networkResponse(() => response);
                throw response;
            });
    };
}

/** Invoke an Aura controller with the pass parameters. */
export function dispatchAction(
    endpoint: string,
    params: UiApiParams,
    config: DispatchActionConfig = {},
    instrumentationCallbacks: InstrumentationCallbacks = {}
): Promise<AuraFetchResponse<unknown>> {
    const { action: actionConfig, cache: cacheConfig } = config;

    const fetchFromNetwork = instrumentFetchFromNetwork(() => {
        return executeGlobalController(endpoint, params, actionConfig).then(
            (body: UiApiBody) => {
                // If a cache is passed, store the action body in the cache before returning the
                // value. Even though `AuraStorage.set` is an asynchronous operation we don't
                // need to wait for the store to resolve/reject before returning the value.
                // Swallow the error to not have an unhandled promise rejection.
                if (cacheConfig !== undefined && cacheConfig.storage !== null) {
                    cacheConfig.storage.set(cacheConfig.key, body).catch((_error) => {});
                }

                if (instrumentationCallbacks.resolveFn) {
                    instrumentationCallbacks.resolveFn({
                        body,
                        params,
                    });
                }

                return createOkResponse(body);
            },
            (err) => {
                if (instrumentationCallbacks.rejectFn) {
                    instrumentationCallbacks.rejectFn({
                        err,
                        params,
                    });
                }

                // Handle ConnectInJava exception shapes
                if (err.data !== undefined && err.data.statusCode !== undefined) {
                    const { data } = err as ConnectInJavaError;
                    throw new AuraFetchResponse(data.statusCode, data);
                }

                // Handle all the other kind of errors
                throw new AuraFetchResponse(HttpStatusCode.ServerError, {
                    error: err.message,
                });
            }
        );
    });

    // If no cache is passed or if the action should be refreshed, directly fetch the action from
    // the server.
    if (
        cacheConfig === undefined ||
        cacheConfig.forceRefresh === true ||
        cacheConfig.storage === null
    ) {
        return fetchFromNetwork();
    }

    // Otherwise check for the action body in the cache. If action is not present in the cache or if
    // the cache lookup fails for any reason fallback to the network.
    return cacheConfig.storage.get(cacheConfig.key).then(
        (cacheResult) => {
            if (cacheResult !== undefined) {
                cacheConfig.statsLogger.logHits();
                return createOkResponse(cacheResult);
            }

            cacheConfig.statsLogger.logMisses();
            return fetchFromNetwork();
        },
        () => {
            return fetchFromNetwork();
        }
    );
}

/**
 * All the methods exposed out of the UiApiController accept a clientOption config. This method
 * adds methods returns a new params object with the client option if necessary, otherwise it
 * returns the passed params object.
 */
export function buildUiApiParams(
    params: UiApiParams,
    resourceRequest: ResourceRequest
): UiApiParams {
    const fixedParams = fixParamsForAuraController(params);

    const ifModifiedSince = resourceRequest.headers['If-Modified-Since'];
    const ifUnmodifiedSince = resourceRequest.headers['If-Unmodified-Since'];

    let clientOptions: UiApiClientOptions = {};

    if (ifModifiedSince !== undefined) {
        clientOptions.ifModifiedSince = ifModifiedSince;
    }

    if (ifUnmodifiedSince !== undefined) {
        clientOptions.ifUnmodifiedSince = ifUnmodifiedSince;
    }

    return ObjectKeys(clientOptions).length > 0
        ? { ...fixedParams, clientOptions: clientOptions }
        : fixedParams;
}

// parameters that need a "Param" suffix appended
const SUFFIXED_PARAMETERS = ['desc', 'page', 'sort'];
const SUFFIX = 'Param';

/**
 * The connect generation code appends a "Param" suffix to certain parameter names when
 * generating Aura controllers. This function accepts a set of UiApiParams and returns
 * an equivalent UiApiParams suitable for passing to an Aura controller.
 */
export function fixParamsForAuraController(params: UiApiParams): UiApiParams {
    let updatedParams = params;

    for (let i = 0; i < SUFFIXED_PARAMETERS.length; ++i) {
        const param = SUFFIXED_PARAMETERS[i];

        if (updatedParams[param] !== undefined) {
            if (updatedParams === params) {
                updatedParams = { ...params };
            }

            updatedParams[param + SUFFIX] = updatedParams[param];
            delete updatedParams[param];
        }
    }

    return updatedParams;
}

/** Returns true if an action should ignore the network cache data. */
export function shouldForceRefresh(resourceRequest: ResourceRequest): boolean {
    const cacheControl = resourceRequest.headers['Cache-Control'];
    return cacheControl !== undefined || cacheControl === 'no-cache';
}

export function registerApiFamilyRoutes(apiFamily: ApiFamily) {
    ObjectKeys(apiFamily).forEach((adapterName) => {
        const adapter = apiFamily[adapterName];
        const { method, predicate, transport } = adapter;
        appRouter[method](
            predicate,
            {
                [`${adapterName}`]: function (resourceRequest: ResourceRequest): Promise<any> {
                    const actionConfig: DispatchActionConfig = {
                        action:
                            transport.action === undefined ? defaultActionConfig : transport.action,
                    };

                    const { urlParams, queryParams, body } = resourceRequest;
                    const params = {
                        ...body,
                        ...fixParamsForAuraController(urlParams),
                        ...fixParamsForAuraController(queryParams),
                    };

                    return dispatchAction(transport.controller, params, actionConfig, {});
                },
            }[adapterName]
        );
    });
}
