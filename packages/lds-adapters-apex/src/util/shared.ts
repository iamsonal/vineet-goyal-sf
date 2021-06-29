import {
    AdapterContext,
    IngestPath,
    Luvio,
    ResourceIngest,
    ResourceResponse,
    Store,
    StoreLink,
} from '@luvio/engine';
import { stableJSONStringify, untrustedIsObject } from '../generated/adapters/adapter-utils';
import { createLink, deepFreeze } from '../generated/types/type-utils';
import { JSONStringify, ObjectKeys, ObjectValues } from './language';

interface ApexScopedModuleParams {
    namespace: string;
    classname: string;
    method: string;
}

export interface ApexInvokerParams extends ApexScopedModuleParams {
    isContinuation: boolean;
}

export interface ApexAdapterConfig {
    apexClass: string;
    apexMethod: string;
    methodParams?: any;
    xSFDCAllowContinuation: string;
}

export const CACHE_CONTROL = 'Cache-Control';
export const SHARED_ADAPTER_CONTEXT_ID = 'apex__shared';

// TODO: APEX_TTL, apexResponseEquals, apexResponseIngest, and validateAdapterConfig should have been code generated
// however compiler does not support response body type any so hand roll for now
/**
 * Time to live for the Apex cache value. 5 minutes.
 */
export const APEX_TTL = 5 * 60 * 1000;

export function apexResponseEquals(existing: any, incoming: any): boolean {
    return JSONStringify(incoming) === JSONStringify(existing);
}

export const apexResponseIngest: ResourceIngest = (
    input: any,
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number
): StoreLink => {
    // skip validation and normalization, since input type is any
    const key = path.fullPath;
    const incomingRecord = input;
    const existingRecord = store.records[key];

    // freeze on ingest (luvio.opaque)
    deepFreeze(incomingRecord);

    if (
        existingRecord === undefined ||
        apexResponseEquals(existingRecord, incomingRecord) === false
    ) {
        luvio.storePublish(key, incomingRecord);
    }

    luvio.storeSetExpiration(key, timestamp + APEX_TTL);

    return createLink(key);
};

export function validateAdapterConfig(untrustedConfig: unknown): unknown | null {
    if (untrustedIsObject(untrustedConfig)) {
        const values = ObjectValues(untrustedConfig);
        return values.indexOf(undefined) === -1 ? untrustedConfig : null;
    }
    return untrustedConfig;
}

/**
 * A standard delimiter when producing cache keys.
 */
export const KEY_DELIM = ':';

export function isEmptyParam(param: unknown): boolean {
    return (
        param === undefined ||
        param === null ||
        (typeof param === 'object' && ObjectKeys(param!).length === 0)
    );
}

export function keyBuilder(
    classname: string,
    method: string,
    isContinuation: string,
    params: unknown
): string {
    return [
        classname.replace('__', KEY_DELIM),
        method,
        isContinuation,
        isEmptyParam(params) ? '' : stableJSONStringify(params),
    ].join(KEY_DELIM);
}

export function configBuilder(
    config: any,
    classname: string,
    method: string,
    isContinuation: boolean
) {
    return {
        apexMethod: method,
        apexClass: classname,
        methodParams: config,
        xSFDCAllowContinuation: isContinuation + '',
    };
}

export function apexClassnameBuilder(namespace: string, classname: string) {
    return namespace !== '' ? `${namespace}__${classname}` : classname;
}

export function shouldCache(resourceResponse: ResourceResponse<any>): boolean {
    if (resourceResponse.headers === undefined) {
        return false;
    } else {
        const cacheControl = resourceResponse.headers[CACHE_CONTROL];
        if (cacheControl === undefined) {
            return false;
        } else {
            return cacheControl !== 'no-cache';
        }
    }
}

export function getCacheableKey(recordId: string) {
    return `${recordId}_cacheable`;
}

function set(context: AdapterContext, recordId: string, value: string) {
    const key = getCacheableKey(recordId);
    context.set(key, value);
}

function get(context: AdapterContext, key: string) {
    return context.get(getCacheableKey(key));
}

export function setCacheControlAdapterContext(
    context: AdapterContext,
    recordId: string,
    response: ResourceResponse<any>
) {
    const { headers } = response;
    if (headers !== undefined && typeof headers[CACHE_CONTROL] === 'string') {
        const value = headers[CACHE_CONTROL];
        set(context, recordId, value);
    }
}

export function isCacheable(config: ApexAdapterConfig, context: AdapterContext) {
    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return checkAdapterContext(context, recordId);
}

export function checkAdapterContext(context: AdapterContext, recordId: string) {
    const contextValue = get(context, recordId);

    if (contextValue === null || contextValue === undefined) {
        return false;
    }
    return contextValue !== 'no-cache';
}
