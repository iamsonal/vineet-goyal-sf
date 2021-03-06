import type {
    AdapterRequestContext,
    Luvio,
    Store,
    Adapter,
    Snapshot,
    UnfulfilledSnapshot,
    LuvioEventObserver,
} from '@luvio/engine';

import { getInstrumentation } from 'o11y/client';
import { adapterUnfulfilledErrorSchema } from 'o11y_schema/sf_lds';
import { instrument as adaptersUiApiInstrument } from '@salesforce/lds-adapters-uiapi';
import {
    instrument as instrumentLwcBindings,
    ADAPTER_UNFULFILLED_ERROR,
} from '@salesforce/lds-bindings';
import { instrument as instrumentNetworkAdapter } from '@salesforce/lds-network-adapter';

export * as METRIC_KEYS from './metric-keys';
export { O11Y_NAMESPACE_LDS_MOBILE } from './utils/observability';
export type { InstrumentationConfig } from './utils/observability';

import {
    ADAPTER_CACHE_HIT_COUNT_METRIC_NAME,
    ADAPTER_CACHE_HIT_DURATION_METRIC_NAME,
    ADAPTER_CACHE_MISS_COUNT_METRIC_NAME,
    ADAPTER_CACHE_MISS_DURATION_METRIC_NAME,
    ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME,
    ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME,
    AGGREGATE_UI_CHUNK_COUNT,
    DUPLICATE_REQUEST_COUNT,
    GET_RECORD_AGGREGATE_INVOKE_COUNT,
    GET_RECORD_NORMAL_INVOKE_COUNT,
    GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT,
    GET_RECORD_NOTIFY_CHANGE_DROP_COUNT,
    GET_GRAPHQL_RESPONSE_MIXED,
    NETWORK_RATE_LIMIT_EXCEEDED_COUNT,
    STORE_BROADCAST_DURATION,
    STORE_INGEST_DURATION,
    STORE_LOOKUP_DURATION,
    STORE_SET_DEFAULT_TTL_OVERRIDE_DURATION,
    STORE_SET_TTL_OVERRIDE_DURATION,
    STORE_SIZE_COUNT,
    STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT,
    STORE_WATCH_SUBSCRIPTIONS_COUNT,
    STORE_TRIM_TASK_COUNT,
    STORE_TRIM_TASK_DURATION,
    CACHE_POLICY_UNDEFINED_COUNTER,
    CACHE_POLICY_COUNTERS,
    ADAPTER_CACHE_HIT_L2_COUNT_METRIC_NAME,
    ADAPTER_CACHE_HIT_L2_DURATION_METRIC_NAME,
    STALE_TAG,
} from './metric-keys';

import {
    OBSERVABILITY_NAMESPACE,
    ADAPTER_INVOCATION_COUNT_METRIC_NAME,
    ADAPTER_ERROR_COUNT_METRIC_NAME,
    TOTAL_ADAPTER_ERROR_COUNT,
    TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT,
} from './utils/observability';

import { ObjectKeys } from './utils/language';
import { LRUCache } from './utils/lru-cache';
export { LRUCache } from './utils/lru-cache';
import { isPromise, stableJSONStringify, throttle } from './utils/utils';
export { MetricsReporter, ERROR_CODE } from './utils/MetricsReporter';
export { withInstrumentation, WithInstrumentation, ReporterType } from './utils/observability';

interface AdapterMetadata {
    apiFamily: string;
    name: string;
    ttl?: number;
}

export interface AdapterUnfulfilledError {
    [ADAPTER_UNFULFILLED_ERROR]: boolean;
    adapterName: string;
    missingPaths: UnfulfilledSnapshot<any, any>['missingPaths'];
    missingLinks: UnfulfilledSnapshot<any, any>['missingLinks'];
}

const NAMESPACE = 'lds';
const APEX_ADAPTER_NAME = 'getApex';
export const NORMALIZED_APEX_ADAPTER_NAME = createMetricsKey('Apex', APEX_ADAPTER_NAME);
const GRAPHQL_ADAPTER_NAME = 'graphQL';

const ldsInstrumentation = getInstrumentation(NAMESPACE);
const observabilityInstrumentation = getInstrumentation(OBSERVABILITY_NAMESPACE);

export class Instrumentation {
    /**
     * Injected to LDS for Luvio specific instrumentation.
     *
     * @param context The transaction context.
     */
    public instrumentLuvio(_context: unknown): void {
        // TODO [W-9783151]: refactor luvio.instrument to not require this class
    }
}

/**
 * Provide this method for the instrument option for a Luvio instance.
 * @param context The transaction context.
 */
export function instrumentLuvio(context: unknown) {
    if (isAdapterUnfulfilledError(context)) {
        // We are consolidating all apex adapter instrumentation calls under a single key
        const normalizedContext = {
            ...context,
            adapterName: normalizeAdapterName(context.adapterName),
        };
        incrementAdapterRequestErrorCount(normalizedContext);
        logAdapterRequestError(normalizedContext);
    }
}

/**
 * Returns whether or not this is an AdapterUnfulfilledError.
 * @param context The transaction context.
 * @returns Whether or not this is an AdapterUnfulfilledError.
 */
function isAdapterUnfulfilledError(context: unknown): context is AdapterUnfulfilledError {
    return (context as AdapterUnfulfilledError)[ADAPTER_UNFULFILLED_ERROR] === true;
}

/**
 * W-8620679
 * Increment the counter for an UnfulfilledSnapshotError coming from luvio
 *
 * @param context The transaction context.
 */
function incrementAdapterRequestErrorCount(context: AdapterUnfulfilledError): void {
    const adapterRequestErrorCounter = createMetricsKey(
        ADAPTER_ERROR_COUNT_METRIC_NAME,
        context.adapterName
    );
    observabilityInstrumentation.incrementCounter(adapterRequestErrorCounter);
    observabilityInstrumentation.incrementCounter(TOTAL_ADAPTER_ERROR_COUNT);
}

/**
 * W-10495632
 * Logs the missing paths and/or links associated with the UnfulfilledSnapshotError.
 *
 * @param context The transaction context.
 */
function logAdapterRequestError(context: AdapterUnfulfilledError): void {
    ldsInstrumentation.error(ADAPTER_UNFULFILLED_ERROR, adapterUnfulfilledErrorSchema, {
        adapter: context.adapterName,
        missing_paths: ObjectKeys(context.missingPaths),
        missing_links: ObjectKeys(context.missingLinks),
    });
}

/**
 * Increment the counter based on the cache policy type for an adapter call
 *
 * @param requestContext Adapter request context that includes cache policy
 */

function incrementAdapterCachePolicyType(requestContext?: AdapterRequestContext) {
    const cachePolicy =
        requestContext && requestContext.cachePolicy && requestContext.cachePolicy.type;

    if (cachePolicy !== undefined) {
        ldsInstrumentation.incrementCounter(CACHE_POLICY_COUNTERS[cachePolicy], 1);
        return;
    }
    ldsInstrumentation.incrementCounter(CACHE_POLICY_UNDEFINED_COUNTER, 1);
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
const adapterCacheMisses: LRUCache = new LRUCache(250);
export function logAdapterCacheMissOutOfTtlDuration(
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
        }
    }
}

export function instrumentAdapter<C, D>(
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): Adapter<C, D> {
    const { apiFamily, name, ttl } = metadata;
    const adapterName = normalizeAdapterName(name, apiFamily);

    /**
     * W-8076905
     * Dynamically generated metric. Simple counter for all requests made by this adapter.
     */
    const wireAdapterRequestMetric = createMetricsKey(
        ADAPTER_INVOCATION_COUNT_METRIC_NAME,
        adapterName
    );

    /**
     * W-6981216
     * Dynamically generated metric. Simple counter for cache hits by adapter name.
     */
    const cacheHitCountByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_HIT_COUNT_METRIC_NAME,
        adapterName
    );

    /**
     * W-10490326
     * Dynamically generated metric. Simple counter for L2 cache hits by adapter name.
     */
    const l2CacheHitCountByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_HIT_L2_COUNT_METRIC_NAME,
        adapterName
    );

    /**
     * W-7404607
     * Dynamically generated metric. Timer for cache hits by adapter name.
     */
    const cacheHitDurationByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_HIT_DURATION_METRIC_NAME,
        adapterName
    );

    /**
     * W-10490326
     * Dynamically generated metric. Timer for L2 cache hits by adapter name.
     */
    const l2CacheHitDurationByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_HIT_L2_DURATION_METRIC_NAME,
        adapterName
    );

    /**
     * W-6981216
     * Dynamically generated metric. Simple counter for cache misses by adapter name.
     */
    const cacheMissCountByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_MISS_COUNT_METRIC_NAME,
        adapterName
    );

    /**
     * W-7404607
     * Dynamically generated metric. Timer for cache hits by adapter name.
     */
    const cacheMissDurationByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_MISS_DURATION_METRIC_NAME,
        adapterName
    );

    /**
     * W-7376275
     * Dynamically generated metric. Measures the amount of time it takes for LDS to get another cache miss on
     * a request we've made in the past.
     * Request Record 1 -> Record 2 -> Back to Record 1 outside of TTL is an example of when this metric will fire.
     */
    const cacheMissOutOfTtlDurationByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME,
        adapterName
    );
    const cacheMissOutOfTtlCountByAdapterMetric = createMetricsKey(
        ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME,
        adapterName
    );

    const instrumentedAdapter = (config: C, requestContext?: AdapterRequestContext) => {
        // increment adapter request metrics
        observabilityInstrumentation.incrementCounter(wireAdapterRequestMetric, 1);
        observabilityInstrumentation.incrementCounter(TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT, 1);
        // increment cache policy metrics
        incrementAdapterCachePolicyType(requestContext);

        // start collecting
        const startTime = Date.now();
        // default to network
        let lookupResult: 'l1' | 'l2' | 'network' = 'network';
        let staleLookup = false;

        const activity = ldsInstrumentation.startActivity(adapterName);

        // executed after adapter returns synchronously or asynchronously and luvio events have been emitted
        const postProcessInstrumentationEvents = () => {
            const executionTime = Date.now() - startTime;

            if (lookupResult === 'l1') {
                ldsInstrumentation.incrementCounter(ADAPTER_CACHE_HIT_COUNT_METRIC_NAME, 1);
                ldsInstrumentation.incrementCounter(cacheHitCountByAdapterMetric, 1);
                ldsInstrumentation.trackValue(cacheHitDurationByAdapterMetric, executionTime);
                // not tracking L1 cache hits with activities
                activity.discard();
                return;
            }

            if (lookupResult === 'l2') {
                let tags: Record<string, boolean> | undefined = undefined;
                if (staleLookup === true) {
                    tags = { [STALE_TAG]: true };
                }
                ldsInstrumentation.incrementCounter(
                    ADAPTER_CACHE_HIT_L2_COUNT_METRIC_NAME,
                    1,
                    undefined,
                    tags
                );
                ldsInstrumentation.incrementCounter(
                    l2CacheHitCountByAdapterMetric,
                    1,
                    undefined,
                    tags
                );
                ldsInstrumentation.trackValue(
                    l2CacheHitDurationByAdapterMetric,
                    executionTime,
                    undefined,
                    tags
                );
                // not tracking L2 cache hits with activities
                activity.discard();
                return;
            }

            if (lookupResult === 'network') {
                ldsInstrumentation.trackValue(
                    cacheMissDurationByAdapterMetric,
                    Date.now() - startTime
                );
                // TODO [W-10484306]: Remove typecasting after this type bug is solved
                activity.stop('cache-miss' as any);

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
            }
        };

        const metricsEventObserver: LuvioEventObserver = {
            onLuvioEvent: (ev) => {
                switch (ev.type) {
                    case 'cache-lookup-end':
                        if (ev.wasResultAsync === false) {
                            // L1 cache hit
                            lookupResult = 'l1';
                        } else {
                            // L2 cache hit
                            lookupResult = 'l2';
                        }
                        if (ev.snapshotState === 'Stale') {
                            staleLookup = true;
                        }
                        break;
                    case 'network-lookup-start':
                        lookupResult = 'network';
                        break;
                    default:
                        // ignore other events
                        break;
                }
            },
        };

        // add metrics event observer to observer list (or create list and context if not defined)
        let requestContextWithInstrumentationObserver = requestContext;
        if (requestContextWithInstrumentationObserver === undefined) {
            requestContextWithInstrumentationObserver = { eventObservers: [] };
        }
        if (requestContextWithInstrumentationObserver.eventObservers === undefined) {
            requestContextWithInstrumentationObserver.eventObservers = [];
        }

        requestContextWithInstrumentationObserver.eventObservers.push(metricsEventObserver);

        try {
            // execute adapter logic
            const result = adapter(config, requestContextWithInstrumentationObserver);

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
                    .then(() => {
                        postProcessInstrumentationEvents();
                    })
                    .catch((error) => {
                        activity.error(error);
                        // TODO [W-10484306]: Remove typecasting after this type bug is solved
                        activity.stop('cache-miss' as any);
                    });
            } else {
                if (result === null) {
                    // not tracking adapters with incomplete configs with activities
                    activity.discard();
                } else {
                    postProcessInstrumentationEvents();
                }
            }

            return result;
        } catch (error) {
            // handle synchronous throw
            activity.discard();
            // rethrow error
            throw error;
        }
    };
    // Set the name property on the function for debugging purposes.
    Object.defineProperty(instrumentedAdapter, 'name', {
        value: name + '__instrumented',
    });

    return isGraphqlAdapter(name) === true
        ? instrumentGraphqlAdapter(instrumentedAdapter)
        : instrumentedAdapter;
}

/**
 * Any graphql get adapter specific instrumentation that we need to log
 * @param snapshot from either in-memory or built after a network hit
 */
function logGraphqlMetrics(snapshot: Snapshot<any>) {
    // We have both data and error in the returned response
    const { data: snapshotData } = snapshot;
    if (
        snapshotData &&
        snapshotData.data &&
        ObjectKeys(snapshotData.data).length > 0 &&
        snapshotData.errors.length > 0
    ) {
        ldsInstrumentation.incrementCounter(GET_GRAPHQL_RESPONSE_MIXED);
    }
}

/**
 * Wraps methods to collect runtime performance using o11y's trackValue API
 * @param obj Object instance containing the methods to instrument
 * @param methods array containing objects with keys for the method name and the metric key to use in o11y
 */
export function instrumentMethods(
    obj: any,
    methods: { methodName: string; metricKey: string }[]
): void {
    for (let i = 0, len = methods.length; i < len; i++) {
        const { methodName, metricKey } = methods[i];
        const originalMethod = obj[methodName];

        obj[methodName] = function (...args: any[]): any {
            const startTime = Date.now();
            try {
                const res = originalMethod.call(this, ...args);
                const executionTime = Date.now() - startTime;
                // handle async resolved/rejected
                if (isPromise(res)) {
                    res.then(() => {
                        ldsInstrumentation.trackValue(metricKey, Date.now() - startTime);
                    }).catch((_error) => {
                        ldsInstrumentation.trackValue(metricKey, Date.now() - startTime, true);
                    });
                } else {
                    // handle synchronous success
                    ldsInstrumentation.trackValue(metricKey, executionTime);
                }
                return res;
            } catch (error) {
                // handle synchronous throw
                ldsInstrumentation.trackValue(metricKey, Date.now() - startTime, true);
                // rethrow error
                throw error;
            }
        };
    }
}

function createMetricsKey(name: string, unit?: string): string {
    let metricName = name;
    if (unit) {
        metricName = metricName + '.' + unit;
    }
    return metricName;
}

/**
 * Returns whether adapter is an Apex one or not.
 * @param adapterName The name of the adapter.
 */
function isApexAdapter(adapterName: string): boolean {
    return adapterName.indexOf(APEX_ADAPTER_NAME) > -1;
}

/**
 * Returns boolean whether adapter is a graphQL one or not.
 * @param adapterName The name of the adapter.
 */
function isGraphqlAdapter(adapterName: string): boolean {
    return adapterName === GRAPHQL_ADAPTER_NAME;
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
    if (isApexAdapter(adapterName)) {
        return NORMALIZED_APEX_ADAPTER_NAME;
    }
    return apiFamily ? `${apiFamily}.${adapterName}` : adapterName;
}

/**
 * implementation for Log Lines.
 * @param payload Content to be logged
 */
export function log(_payload: any): void {
    // TODO [W-9782972]: internal logging
}

/**
 * Calls instrumentation/service telemetry counter
 * @param name Name of the metric
 * @param value number to increment by, if undefined increment by 1
 */
export function incrementCounterMetric(name: string, number?: number) {
    ldsInstrumentation.incrementCounter(name, number);
}

/**
 * Calls instrumentation/service telemetry percentileHistogram
 * @param name Name of the metric
 * @param value number used to update the percentileHistogram
 */
export function updatePercentileHistogramMetric(name: string, value: number) {
    ldsInstrumentation.trackValue(name, value);
}

export function setAggregateUiChunkCountMetric(chunkCount: number): void {
    updatePercentileHistogramMetric(AGGREGATE_UI_CHUNK_COUNT, chunkCount);
}

export function incrementGetRecordNormalInvokeCount(): void {
    incrementCounterMetric(GET_RECORD_NORMAL_INVOKE_COUNT);
}

export function incrementGetRecordAggregateInvokeCount(): void {
    incrementCounterMetric(GET_RECORD_AGGREGATE_INVOKE_COUNT);
}

export function incrementGetRecordNotifyChangeAllowCount(): void {
    incrementCounterMetric(GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT);
}

export function incrementGetRecordNotifyChangeDropCount(): void {
    incrementCounterMetric(GET_RECORD_NOTIFY_CHANGE_DROP_COUNT);
}

export function incrementNetworkRateLimitExceededCount(): void {
    incrementCounterMetric(NETWORK_RATE_LIMIT_EXCEEDED_COUNT);
}

function instrumentStoreTrimTask(callback: () => number) {
    return () => {
        ldsInstrumentation.incrementCounter(STORE_TRIM_TASK_COUNT);
        const startTime = Date.now();
        const res = callback();
        ldsInstrumentation.trackValue(STORE_TRIM_TASK_DURATION, Date.now() - startTime);
        // TODO [W-10060579]: replace record count per trim task with metric
        return res;
    };
}

export function setStoreScheduler(store: Store) {
    const originalScheduler = store.scheduler;
    store.scheduler = (callback) => {
        originalScheduler(instrumentStoreTrimTask(callback));
    };
}

type storeStatsCallback = () => void;
export function instrumentStoreStatsCallback(store: Store) {
    return () => {
        const { records, snapshotSubscriptions, watchSubscriptions } = store;
        updatePercentileHistogramMetric(STORE_SIZE_COUNT, ObjectKeys(records).length);
        updatePercentileHistogramMetric(
            STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT,
            ObjectKeys(snapshotSubscriptions).length
        );
        updatePercentileHistogramMetric(
            STORE_WATCH_SUBSCRIPTIONS_COUNT,
            ObjectKeys(watchSubscriptions).length
        );
    };
}

/**
 * Collects additional store statistics by tying its periodic,
 * point-in-time data collection with a luvio method
 * @param luvio
 * @param store
 */
export function setupStoreStatsCollection(luvio: Luvio, callback: storeStatsCallback) {
    const wrapMethod = 'storeBroadcast';
    const originalMethod = luvio[wrapMethod];
    const throttledCallback = throttle(callback, 200);
    luvio[wrapMethod] = function (...args) {
        throttledCallback();
        originalMethod.call(this, ...args);
    };
}

/**
 * @param instrumentedAdapter
 * @returns instrumentedGraphqlAdapter, which logs additional metrics for get graphQL adapter
 */
export function instrumentGraphqlAdapter<C, D>(instrumentedAdapter: Adapter<C, D>): Adapter<C, D> {
    const instrumentedGraphqlAdapter = (config: C, requestContext?: AdapterRequestContext) => {
        const result = instrumentedAdapter(config, requestContext);

        if (result === null) {
            return result;
        }
        if (isPromise(result)) {
            result.then((_snapshot: Snapshot<D>) => {
                logGraphqlMetrics(_snapshot);
            });
        } else {
            logGraphqlMetrics(result);
        }
        return result;
    };
    return instrumentedGraphqlAdapter;
}

/**
 * Provides concrete implementations using o11y/client for instrumentation hooks
 */
export function setInstrumentationHooks() {
    adaptersUiApiInstrument({
        recordConflictsResolved: (serverRequestCount: number) =>
            updatePercentileHistogramMetric('record-conflicts-resolved', serverRequestCount),
        nullDisplayValueConflict: ({ fieldType, areValuesEqual }) => {
            const metricName = `merge-null-dv-count.${fieldType}`;
            if (fieldType === 'scalar') {
                incrementCounterMetric(`${metricName}.${areValuesEqual}`);
            } else {
                incrementCounterMetric(metricName);
            }
        },
        getRecordNotifyChangeAllowed: incrementGetRecordNotifyChangeAllowCount,
        getRecordNotifyChangeDropped: incrementGetRecordNotifyChangeDropCount,
    });
    instrumentLwcBindings({
        instrumentAdapter: instrumentAdapter,
    });
    instrumentNetworkAdapter({
        aggregateUiChunkCount: (cb) => setAggregateUiChunkCountMetric(cb()),
        duplicateRequest: () => incrementCounterMetric(DUPLICATE_REQUEST_COUNT),
        getRecordAggregateInvoke: incrementGetRecordAggregateInvokeCount,
        getRecordNormalInvoke: incrementGetRecordNormalInvokeCount,
        networkRateLimitExceeded: incrementNetworkRateLimitExceededCount,
    });
}

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, store: Store): void {
    setInstrumentationHooks();
    instrumentStoreMethods(luvio, store);
    setupStoreStatsCollection(luvio, instrumentStoreStatsCallback(store));

    setStoreScheduler(store);

    // TODO [W-10061321]: use periodic logger to log aggregated store stats
}

export function instrumentStoreMethods(luvio: Luvio, _store: Store) {
    instrumentMethods(luvio, [
        { methodName: 'storeBroadcast', metricKey: STORE_BROADCAST_DURATION },
        { methodName: 'storeIngest', metricKey: STORE_INGEST_DURATION },
        { methodName: 'storeLookup', metricKey: STORE_LOOKUP_DURATION },
        { methodName: 'storeSetTTLOverride', metricKey: STORE_SET_TTL_OVERRIDE_DURATION },
        {
            methodName: 'storeSetDefaultTTLOverride',
            metricKey: STORE_SET_DEFAULT_TTL_OVERRIDE_DURATION,
        },
    ]);
}

export const instrumentation = new Instrumentation();
