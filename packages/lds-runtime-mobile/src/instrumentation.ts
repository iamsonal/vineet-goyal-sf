import { Luvio, Store, Adapter, Snapshot } from '@luvio/engine';
import { getInstrumentation } from 'o11y/client';
import { isPromise, stableJSONStringify } from './utils/utils';
import { LRUCache } from './utils/lru-cache';

const NAMESPACE = 'lds-runtime-mobile';
const OBSERVABILITY_NAMESPACE = 'LIGHTNING.lds.service';
const ADAPTER_INVOCATION_COUNT_METRIC_NAME = 'request';
// const ADAPTER_ERROR_COUNT_METRIC_NAME = 'error';
const ADAPTER_CACHE_HIT_COUNT_METRIC_NAME = 'cache-hit-count';
const ADAPTER_CACHE_HIT_DURATION_METRIC_NAME = 'cache-hit-duration';
const ADAPTER_CACHE_MISS_COUNT_METRIC_NAME = 'cache-miss-count';
const ADAPTER_CACHE_MISS_DURATION_METRIC_NAME = 'cache-miss-duration';
const ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME = 'cache-miss-out-of-ttl-count';
const ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME = 'cache-miss-out-of-ttl-duration';

const APEX_ADAPTER_NAME = 'getApex';
const NORMALIZED_APEX_ADAPTER_NAME = `Apex.${APEX_ADAPTER_NAME}`;
// const GRAPHQL_ADAPTER_NAME = 'graphQL';

const ldsInstrumentation = getInstrumentation(NAMESPACE);
const observabilityInstrumentation = getInstrumentation(OBSERVABILITY_NAMESPACE);

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, _store: Store): void {
    instrumentMethods(luvio, ['storeBroadcast', 'storeIngest', 'storeLookup']);

    // TODO [W-9782972]: part of internal instrumentation work
    //setStoreScheduler(store);
}

// pass in class, obj, what have you, with the method you want to wrap to collect duration metrics
// e.g. pass in Luvio with ['storeBroadcast', 'storeIngest', 'storeLookup']
export function instrumentMethods(obj: any, methods: string[]): void {
    for (let i = 0, len = methods.length; i < len; i++) {
        const method = methods[i];
        const originalMethod = obj[method];

        obj[method] = function (...args: any[]): any {
            const startTime = Date.now();
            try {
                const res = originalMethod.call(this, ...args);
                const executionTime = Date.now() - startTime;
                // handle async resolved/rejected
                if (isPromise(res)) {
                    res.then(() => {
                        ldsInstrumentation.trackValue(method, Date.now() - startTime);
                    }).catch((_error) => {
                        ldsInstrumentation.trackValue(method, Date.now() - startTime, true);
                    });
                } else {
                    // handle synchronous success
                    ldsInstrumentation.trackValue(method, executionTime);
                }
                return res;
            } catch (error) {
                // handle synchronous throw
                ldsInstrumentation.trackValue(method, Date.now() - startTime, true);
                // rethrow error
                throw error;
            }
        };
    }
}

interface AdapterMetadata {
    apiFamily: string;
    name: string;
    ttl?: number;
}

const adapterCacheMisses: LRUCache = new LRUCache(250);
export function instrumentAdapter<C, D>(
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): Adapter<C, D> {
    const { apiFamily, name, ttl } = metadata;
    const adapterName = normalizeAdapterName(name, apiFamily);

    //Aura API - CacheStatsLogger
    // const stats = isGetApexAdapter ? getApexCacheStats : registerLdsCacheStats(adapterName);
    // const ttlMissStats = isGetApexAdapter
    //     ? getApexTtlCacheStats
    //     : registerLdsCacheStats(adapterName + ':' + CACHE_STATS_OUT_OF_TTL_MISS_POSTFIX);

    /**
     * W-8076905
     * Dynamically generated metric. Simple counter for all requests made by this adapter.
     */
    const wireAdapterRequestMetric = `${ADAPTER_INVOCATION_COUNT_METRIC_NAME}.${adapterName}`;

    /**
     * W-6981216
     * Dynamically generated metric. Simple counter for cache hits by adapter name.
     */
    const cacheHitCountByAdapterMetric = `${ADAPTER_CACHE_HIT_COUNT_METRIC_NAME}.${adapterName}`;

    /**
     * W-7404607
     * Dynamically generated metric. Timer for cache hits by adapter name.
     */
    const cacheHitDurationByAdapterMetric = `${ADAPTER_CACHE_HIT_DURATION_METRIC_NAME}.${adapterName}`;

    /**
     * W-6981216
     * Dynamically generated metric. Simple counter for cache misses by adapter name.
     */
    const cacheMissCountByAdapterMetric = `${ADAPTER_CACHE_MISS_COUNT_METRIC_NAME}.${adapterName}`;

    /**
     * W-7404607
     * Dynamically generated metric. Timer for cache hits by adapter name.
     */
    const cacheMissDurationByAdapterMetric = `${ADAPTER_CACHE_MISS_DURATION_METRIC_NAME}.${adapterName}`;

    /**
     * W-7376275
     * Dynamically generated metric. Measures the amount of time it takes for LDS to get another cache miss on
     * a request we've made in the past.
     * Request Record 1 -> Record 2 -> Back to Record 1 outside of TTL is an example of when this metric will fire.
     */
    const cacheMissOutOfTtlDurationByAdapterMetric = `${ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME}.${adapterName}`;
    const cacheMissOutOfTtlCountByAdapterMetric = `${ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME}.${adapterName}`;

    const instrumentedAdapter = (config: C) => {
        // increment adapter request metrics
        observabilityInstrumentation.incrementCounter(wireAdapterRequestMetric, 1);
        observabilityInstrumentation.incrementCounter(ADAPTER_INVOCATION_COUNT_METRIC_NAME, 1);

        // start collecting
        const startTime = Date.now();
        const activity = ldsInstrumentation.startActivity(adapterName);

        try {
            // execute adapter logic
            const result = adapter(config);
            const executionTime = Date.now() - startTime;

            // In the case where the adapter returns a non-Pending Snapshot it is constructed out of the store
            // (cache hit) whereas a Promise<Snapshot> or Pending Snapshot indicates a network request (cache miss).
            //
            // Note: we can't do a plain instanceof check for a promise here since the Promise may
            // originate from another javascript realm (for example: in jest test). Instead we use a
            // duck-typing approach by checking if the result has a then property.
            //
            // For adapters without persistent store:
            //  - total cache hit ratio:
            //      [in-memory cache hit count] / ([in-memory cache hit count] + [in-memory cache miss count])
            // For adapters with persistent store:
            //  - in-memory cache hit ratio:
            //      [in-memory cache hit count] / ([in-memory cache hit count] + [in-memory cache miss count])
            //  - total cache hit ratio:
            //      ([in-memory cache hit count] + [store cache hit count]) / ([in-memory cache hit count] + [in-memory cache miss count])

            // if result === null then config is insufficient/invalid so do not log
            if (isPromise(result)) {
                // handle async resolved/rejected
                result
                    .then((_snapshot: Snapshot<D>) => {
                        activity.stop('cache-miss');
                        ldsInstrumentation.trackValue(
                            cacheMissDurationByAdapterMetric,
                            Date.now() - startTime
                        );
                    })
                    .catch((error) => {
                        activity.error(error);
                    });
                //Aura API
                // stats.logMisses();
                ldsInstrumentation.incrementCounter(ADAPTER_CACHE_MISS_COUNT_METRIC_NAME, 1);
                ldsInstrumentation.incrementCounter(cacheMissCountByAdapterMetric, 1);

                if (ttl !== undefined) {
                    logAdapterCacheMissOutOfTtlDuration(
                        adapterName,
                        config,
                        Date.now(),
                        ttl,
                        cacheMissOutOfTtlCountByAdapterMetric,
                        cacheMissOutOfTtlDurationByAdapterMetric
                    );
                }
            } else if (result !== null) {
                activity.stop('cache-hit');
                //Aura API
                // stats.logHits();
                ldsInstrumentation.incrementCounter(ADAPTER_CACHE_HIT_COUNT_METRIC_NAME, 1);
                ldsInstrumentation.incrementCounter(cacheHitCountByAdapterMetric, 1);
                ldsInstrumentation.trackValue(cacheHitDurationByAdapterMetric, executionTime);
            }

            return result;
        } catch (error) {
            // handle synchronous throw
            activity.error(error);
            // rethrow error
            throw error;
        }
    };
    // Set the name property on the function for debugging purposes.
    Object.defineProperty(instrumentedAdapter, 'name', {
        value: name + '__instrumented',
    });
    // TODO [W-9934840]: follow up WI to enable this
    // return isGraphqlAdapter(name) === true
    //     ? instrumentGraphqlAdapter(instrumentedAdapter)
    //     : instrumentedAdapter;
    return instrumentedAdapter;
}

/**
 * Normalizes getApex adapter names to `Apex.getApex`. Non-Apex adapters will be prefixed with
 * API family, if supplied. Example: `UiApi.getRecord`.
 *
 * Note: If you are adding additional logging that can come from getApex adapter contexts that provide
 * the full getApex adapter name (i.e. getApex_[namespace]_[class]_[function]_[continuation]),
 * ensure to call this method to normalize all logging to 'getApex'. This
 * is because Argus has a 50k key cardinality limit. More context: W-8379680.
 *
 * @param adapterName The name of the adapter.
 * @param apiFamily The API family of the adapter.
 */
function normalizeAdapterName(adapterName: string, apiFamily?: string): string {
    // We are consolidating all apex adapter instrumentation calls under a single key
    if (isApexAdapter(adapterName)) {
        return NORMALIZED_APEX_ADAPTER_NAME;
    }
    return apiFamily ? `${apiFamily}.${adapterName}` : adapterName;
}

/**
 * Returns whether adapter is an Apex one or not.
 * @param adapterName The name of the adapter.
 */
function isApexAdapter(adapterName: string): boolean {
    return adapterName.indexOf(APEX_ADAPTER_NAME) > -1;
}

/**
 * Logs when adapter requests come in. If we have subsequent cache misses on a given config, beyond its TTL then log the duration to metrics.
 * Backed by an LRU Cache implementation to prevent too many record entries from being stored in-memory.
 * @param name The wire adapter name.
 * @param config The config passed into wire adapter.
 * @param currentCacheMissTimestamp Timestamp for when the request was made.
 * @param ttl TTL for the wire adapter.
 * @param durationMetricName Name for duration metric.
 * @param counterMetricName Name for counter metric.
 */
function logAdapterCacheMissOutOfTtlDuration(
    name: string,
    config: unknown,
    currentCacheMissTimestamp: number,
    ttl: number,
    counterMetricName: string,
    durationMetricName: string
): void {
    const configKey = `${name}:${stableJSONStringify(config)}`;
    const existingCacheMissTimestamp = adapterCacheMisses.get(configKey);
    adapterCacheMisses.set(configKey, currentCacheMissTimestamp);
    if (existingCacheMissTimestamp !== undefined) {
        const duration = currentCacheMissTimestamp - existingCacheMissTimestamp;
        if (duration > ttl) {
            ldsInstrumentation.incrementCounter(counterMetricName, 1);
            ldsInstrumentation.trackValue(durationMetricName, duration);
            //Aura API
            // ttlMissStats.logMisses();
        }
    }
}
