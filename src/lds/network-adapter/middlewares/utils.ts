import { executeGlobalController, ActionConfig } from 'aura';
import { AuraStorage } from 'aura-storage';
import { CacheStatsLogger } from 'instrumentation/service';

import { HttpStatusCode, ResourceRequest } from '@ldsjs/engine';
import { AuraFetchResponse } from '../AuraFetchResponse';

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

export interface DispatchActionConfig {
    action?: ActionConfig;
    cache?: CacheConfig;
}

interface UiApiClientOptions {
    ifModifiedSince?: string;
    ifUnmodifiedSince?: string;
}

interface UiApiParams {
    [name: string]: any;
    clientOptions?: UiApiClientOptions;
}

function createOkResponse(body: unknown): AuraFetchResponse<unknown> {
    return new AuraFetchResponse(HttpStatusCode.Ok, body);
}

/** Invoke an Aura controller with the pass parameters. */
export function dispatchAction(
    endpoint: string,
    params: any,
    config: DispatchActionConfig = {}
): Promise<AuraFetchResponse<unknown>> {
    const { action: actionConfig, cache: cacheConfig } = config;

    const fetchFromNetwork = () => {
        return executeGlobalController(endpoint, params, actionConfig).then(
            body => {
                // If a cache is passed, store the action body in the cache before returning the
                // value. Even though `AuraStorage.set` is an asynchronous operation we don't
                // need to wait for the store to resolve/reject before returning the value.
                // Swallow the error to not have an unhandled promise rejection.
                if (cacheConfig !== undefined && cacheConfig.storage !== null) {
                    cacheConfig.storage.set(cacheConfig.key, body).catch(_error => {});
                }

                return createOkResponse(body);
            },
            err => {
                // Handle ConnectedInJava exception shapes
                if (err.data !== undefined && err.data.statusCode !== undefined) {
                    const { data } = err;
                    throw new AuraFetchResponse(data.statusCode, data);
                }

                // Handle all the other kind of errors
                throw new AuraFetchResponse(HttpStatusCode.ServerError, {
                    error: err.message,
                });
            }
        );
    };

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
        cacheResult => {
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
    const ifModifiedSince = resourceRequest.headers['If-Modified-Since'];
    const ifUnmodifiedSince = resourceRequest.headers['If-Unmodified-Since'];

    let clientOptions: UiApiClientOptions = {};

    if (ifModifiedSince !== undefined) {
        clientOptions.ifModifiedSince = ifModifiedSince;
    }

    if (ifUnmodifiedSince !== undefined) {
        clientOptions.ifUnmodifiedSince = ifUnmodifiedSince;
    }

    return Object.keys(clientOptions).length > 0
        ? { ...params, clientOptions: clientOptions }
        : params;
}

/** Returns true if an action should ignore the network cache data. */
export function shouldForceRefresh(resourceRequest: ResourceRequest): boolean {
    const cacheControl = resourceRequest.headers['Cache-Control'];
    return cacheControl !== undefined || cacheControl === 'no-cache';
}
