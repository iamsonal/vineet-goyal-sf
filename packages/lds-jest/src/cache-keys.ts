import type { AdapterFactory, CacheKeySet, FetchResponse } from '@luvio/engine';
import { Environment, Luvio, Store } from '@luvio/engine';

function clone<T>(theObj: T): T {
    return JSON.parse(JSON.stringify(theObj));
}

function setupLuvio<TResponse>(networkResponse: TResponse) {
    const fetchResponse: FetchResponse<TResponse> = {
        body: clone(networkResponse),
        headers: {},
        ok: true,
        status: 200,
        statusText: '',
    };

    const store = new Store();
    const luvio = new Luvio(new Environment(store, jest.fn().mockResolvedValue(fetchResponse)));

    return { luvio, store };
}

/**
 * This function will call an adapter with a fresh luvio instance (ie: empty cache).
 * It will also call getResponseCacheKeys.  It will then ensure the cache key set
 * matches the ingested cache keys from the network ingest.
 */
export async function testResponseCacheKeysMatchIngestCacheKeys<
    TResourceParams,
    TConfig,
    TResponse
>(
    responseCacheKeysFunc: (resourceParams: TResourceParams, response: TResponse) => CacheKeySet,
    adapterFactory: AdapterFactory<TConfig, TResponse>,
    config: TConfig,
    resourceParams: TResourceParams,
    response: TResponse
) {
    // get cache keys from getResponseCacheKeys
    const cacheKeySet = responseCacheKeysFunc(resourceParams, response);
    const cacheKeys = Object.keys(cacheKeySet);

    // call adapter with fresh luvio instance and see values in store after ingest
    const { luvio, store } = setupLuvio(response);
    const adapter = adapterFactory(luvio);
    const snapshot = await adapter(config);

    // make sure the snapshot was ingested successfully
    expect(snapshot).not.toBeNull();
    expect(snapshot!.state).toBe('Fulfilled');

    // validate keys match
    expect(cacheKeys.sort()).toEqual(Object.keys(store.records).sort());

    // validate cache key entries have the prefix and rep name
    for (const cacheKey of cacheKeys) {
        const entry = cacheKeySet[cacheKey];
        const cacheKeyPrefix = `${entry.namespace}::${entry.representationName}`;
        expect(cacheKey.startsWith(cacheKeyPrefix)).toBe(true);
    }
}
