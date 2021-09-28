import {
    AdapterContext,
    IngestPath,
    Luvio,
    ResourceIngest,
    ResourceResponse,
    Store,
    StoreLink,
    Headers,
} from '@luvio/engine';
import {
    stableJSONStringify,
    untrustedIsObject,
    keyPrefix,
} from '../generated/adapters/adapter-utils';
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

export const CACHE_CONTROL = 'cache-control';
export const SHARED_ADAPTER_CONTEXT_ID = 'apex__shared';

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: APEX_TTL, apexResponseEquals, apexResponseIngest, and validateAdapterConfig should have been code generated
// however compiler does not support response body type any so hand roll for now
/**
 * Time to live for the Apex cache value. 5 minutes.
 */
export const APEX_TTL = 5 * 60 * 1000;

const APEX_STORE_METADATA_PARAMS = {
    ttl: APEX_TTL,
    namespace: keyPrefix,
    representationName: '',
};

export function apexResponseEquals(existing: any, incoming: any): boolean {
    return JSONStringify(incoming) === JSONStringify(existing);
}

export const apexResponseIngest: ResourceIngest = (
    input: any,
    path: IngestPath,
    luvio: Luvio,
    store: Store
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

    luvio.publishStoreMetadata(key, APEX_STORE_METADATA_PARAMS);

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

function isCacheControlValueCacheable(value: string | undefined | null) {
    if (value === undefined || value === null || typeof value !== 'string') {
        return false;
    }

    return value.indexOf('no-cache') < 0 && value.indexOf('no-store') < 0;
}

function getCacheControlHeaderValue(headers: Headers | undefined): string | undefined {
    if (headers === undefined) {
        return undefined;
    }

    // header fields are case-insensitive according to
    // https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
    const headerKeys = ObjectKeys(headers);
    for (let i = 0, len = headerKeys.length; i < len; i += 1) {
        const key = headerKeys[i];
        if (key.toLowerCase() === CACHE_CONTROL) {
            return headers[key];
        }
    }

    return undefined;
}

export function shouldCache(resourceResponse: ResourceResponse<any>): boolean {
    const { headers } = resourceResponse;

    const headerValue = getCacheControlHeaderValue(headers);

    return isCacheControlValueCacheable(headerValue);
}

export function getCacheableKey(recordId: string) {
    return `${recordId}_cacheable`;
}

function set(context: AdapterContext, recordId: string, value: string) {
    const key = getCacheableKey(recordId);
    context.set(key, value);
}

function get<T>(context: AdapterContext, key: string) {
    return context.get<T>(getCacheableKey(key));
}

export function setCacheControlAdapterContext(
    context: AdapterContext,
    recordId: string,
    response: ResourceResponse<any>
) {
    const { headers } = response;
    const headerValue = getCacheControlHeaderValue(headers);
    if (headerValue !== undefined) {
        set(context, recordId, headerValue);
    }
}

export function isCacheable(config: ApexAdapterConfig, context: AdapterContext) {
    const { apexClass, apexMethod, xSFDCAllowContinuation, methodParams } = config;
    const recordId = keyBuilder(apexClass, apexMethod, xSFDCAllowContinuation, methodParams);

    return checkAdapterContext(context, recordId);
}

export function checkAdapterContext(context: AdapterContext, recordId: string) {
    const contextValue = get<string>(context, recordId);

    return isCacheControlValueCacheable(contextValue);
}
