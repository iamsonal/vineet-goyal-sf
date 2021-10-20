import { Luvio, Store, Adapter, Snapshot, UnfulfilledSnapshot } from '@luvio/engine';
import { REFRESH_ADAPTER_EVENT, ADAPTER_UNFULFILLED_ERROR } from '@luvio/lwc-luvio';

import { getInstrumentation } from 'o11y/client';

import {
    ADAPTER_CACHE_HIT_COUNT_METRIC_NAME,
    ADAPTER_CACHE_HIT_DURATION_METRIC_NAME,
    ADAPTER_CACHE_MISS_COUNT_METRIC_NAME,
    ADAPTER_CACHE_MISS_DURATION_METRIC_NAME,
    ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME,
    ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME,
    AGGREGATE_CONNECT_ERROR_COUNT,
    AGGREGATE_UI_CHUNK_COUNT,
    GET_RECORD_AGGREGATE_INVOKE_COUNT,
    GET_RECORD_AGGREGATE_RETRY_COUNT,
    GET_RECORD_NORMAL_INVOKE_COUNT,
    GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT,
    GET_RECORD_NOTIFY_CHANGE_DROP_COUNT,
    GET_GRAPHQL_RESPONSE_MIXED,
    NETWORK_RATE_LIMIT_EXCEEDED_COUNT,
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
import { isPromise, stableJSONStringify } from './utils/utils';

export const registerLdsCacheStats = (_name: string) => {};
interface AdapterUnfulfilledError {
    [ADAPTER_UNFULFILLED_ERROR]: boolean;
    adapterName: string;
    missingPaths: UnfulfilledSnapshot<any, any>['missingPaths'];
    missingLinks: UnfulfilledSnapshot<any, any>['missingLinks'];
}

const APEX_ADAPTER_NAME = 'getApex';
export const NORMALIZED_APEX_ADAPTER_NAME = `Apex.${APEX_ADAPTER_NAME}`;
const GRAPHQL_ADAPTER_NAME = 'graphQL';

// Event comes in from lwc-luvio package
interface RefreshAdapterEvent {
    [REFRESH_ADAPTER_EVENT]: boolean;
    adapterName: string;
}
interface RefreshAdapterEvents {
    [adapterName: string]: number;
}
export const REFRESH_APEX_KEY = 'refreshApex';
export const REFRESH_UIAPI_KEY = 'refreshUiApi';
export const SUPPORTED_KEY = 'refreshSupported';
export const UNSUPPORTED_KEY = 'refreshUnsupported';

// TODO [W-9782972]: refresh
// const REFRESH_EVENTSOURCE = 'lds-refresh-summary';
// const REFRESH_EVENTTYPE = 'system';
// const REFRESH_PAYLOAD_TARGET = 'adapters';
// const REFRESH_PAYLOAD_SCOPE = 'lds';

interface RefreshApiCallEventStats {
    [REFRESH_APEX_KEY]: number;
    [REFRESH_UIAPI_KEY]: number;
    [SUPPORTED_KEY]: number;
    [UNSUPPORTED_KEY]: number;
}

type refreshApiNames = {
    refreshApex: string;
    refreshUiApi: string;
};

// TODO [W-9782972]: store stats
// interface LdsStatsReport {
//     recordCount: number;
//     subscriptionCount: number;
//     snapshotSubscriptionCount: number;
//     watchSubscriptionCount: number;
// }

const INCOMING_WEAKETAG_0_KEY = 'incoming-weaketag-0';
const EXISTING_WEAKETAG_0_KEY = 'existing-weaketag-0';

interface WeakEtagZeroEvents {
    [apiName: string]: {
        [EXISTING_WEAKETAG_0_KEY]: number;
        [INCOMING_WEAKETAG_0_KEY]: number;
    };
}

interface AdapterMetadata {
    apiFamily: string;
    name: string;
    ttl?: number;
}

const NAMESPACE = 'lds';
// TODO [W-9782972]: update when logs get updated
// const STORE_STATS_MARK_NAME = 'store-stats';
// const RUNTIME_PERF_MARK_NAME = 'runtime-perf';
// const NETWORK_TRANSACTION_NAME = 'lds-network';

const RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME = 'record-api-name-change-count';

// TODO [W-9782972]: store trim task
// const STORE_TRIM_TASK_NAME = 'store-trim-task';
// const STORE_TRIMMED_COUNT = 'store-trimmed-count';
// const storeTrimTaskMetric = counter(STORE_TRIM_TASK_COUNT);
// const storeTrimTaskTimer = timer(STORE_TRIM_TASK_DURATION);

const ldsInstrumentation = getInstrumentation(NAMESPACE);
const observabilityInstrumentation = getInstrumentation(OBSERVABILITY_NAMESPACE);

export class Instrumentation {
    private refreshAdapterEvents: RefreshAdapterEvents = {};
    private refreshApiCallEventStats: RefreshApiCallEventStats = {
        [REFRESH_APEX_KEY]: 0,
        [REFRESH_UIAPI_KEY]: 0,
        [SUPPORTED_KEY]: 0,
        [UNSUPPORTED_KEY]: 0,
    };
    private lastRefreshApiCall: keyof refreshApiNames | null = null;
    private weakEtagZeroEvents: WeakEtagZeroEvents = {};

    constructor() {
        // TODO [W-9782972]: need periodic logger equivalent for our summary instrumentation
        // if (typeof window !== 'undefined' && window.addEventListener) {
        //     window.addEventListener('beforeunload', () => {
        //         if (ObjectKeys(this.weakEtagZeroEvents).length > 0) {
        //             perfStart(NETWORK_TRANSACTION_NAME);
        //             perfEnd(NETWORK_TRANSACTION_NAME, this.weakEtagZeroEvents);
        //         }
        //     });
        // }
        // registerPeriodicLogger(NAMESPACE, this.logRefreshStats.bind(this));
    }

    /**
     * Injected to LDS for Luvio specific instrumentation.
     *
     * @param context The transaction context.
     */
    public instrumentLuvio(context: unknown): void {
        if (this.isRefreshAdapterEvent(context)) {
            this.aggregateRefreshAdapterEvents(context);
        } else if (this.isAdapterUnfulfilledError(context)) {
            this.incrementAdapterRequestErrorCount(context);
        } else {
            // Unknown use of luvio.instrument
            // should we log something here?
        }
    }

    /**
     * Returns whether or not this is a RefreshAdapterEvent.
     * @param context The transaction context.
     * @returns Whether or not this is a RefreshAdapterEvent.
     */
    private isRefreshAdapterEvent(context: unknown): context is RefreshAdapterEvent {
        return (context as RefreshAdapterEvent)[REFRESH_ADAPTER_EVENT] === true;
    }

    /**
     * Returns whether or not this is an AdapterUnfulfilledError.
     * @param context The transaction context.
     * @returns Whether or not this is an AdapterUnfulfilledError.
     */
    private isAdapterUnfulfilledError(context: unknown): context is AdapterUnfulfilledError {
        return (context as AdapterUnfulfilledError)[ADAPTER_UNFULFILLED_ERROR] === true;
    }

    /**
     * Specific instrumentation for getRecordNotifyChange.
     * temporary implementation to match existing aura call for now
     *
     * @param uniqueWeakEtags whether weakEtags match or not
     * @param error if dispatchResourceRequest fails for any reason
     */
    public notifyChangeNetwork(_uniqueWeakEtags: boolean | null, _error?: boolean) {
        // TODO [W-9782972]: internal logging
        // perfStart(NETWORK_TRANSACTION_NAME);
        // if (error === true) {
        //     perfEnd(NETWORK_TRANSACTION_NAME, { 'notify-change-network': 'error' });
        // } else {
        //     perfEnd(NETWORK_TRANSACTION_NAME, { 'notify-change-network': uniqueWeakEtags });
        // }
    }

    /**
     * Parses and aggregates weakETagZero events to be sent in summarized log line.
     * @param context The transaction context.
     */
    public aggregateWeakETagEvents(
        incomingWeakEtagZero: boolean,
        existingWeakEtagZero: boolean,
        apiName: string
    ): void {
        const key = 'weaketag-0-' + apiName;
        if (this.weakEtagZeroEvents[key] === undefined) {
            this.weakEtagZeroEvents[key] = {
                [EXISTING_WEAKETAG_0_KEY]: 0,
                [INCOMING_WEAKETAG_0_KEY]: 0,
            };
        }
        if (existingWeakEtagZero) {
            this.weakEtagZeroEvents[key][EXISTING_WEAKETAG_0_KEY] += 1;
        }
        if (incomingWeakEtagZero) {
            this.weakEtagZeroEvents[key][INCOMING_WEAKETAG_0_KEY] += 1;
        }
    }

    /**
     * Aggregates refresh adapter events to be sent in summarized log line.
     *   - how many times refreshApex is called
     *   - how many times refresh from lightning/uiRecordApi is called
     *   - number of supported calls: refreshApex called on apex adapter
     *   - number of unsupported calls: refreshApex on non-apex adapter
     *          + any use of refresh from uiRecordApi module
     *   - count of refresh calls per adapter
     * @param context The refresh adapter event.
     */
    private aggregateRefreshAdapterEvents(context: RefreshAdapterEvent): void {
        // We are consolidating all apex adapter instrumentation calls under a single key
        // Adding additional logging that getApex adapters can invoke? Read normalizeAdapterName ts-doc.
        const adapterName = normalizeAdapterName(context.adapterName);
        if (this.lastRefreshApiCall === REFRESH_APEX_KEY) {
            if (isApexAdapter(adapterName)) {
                this.refreshApiCallEventStats[SUPPORTED_KEY] += 1;
            } else {
                this.refreshApiCallEventStats[UNSUPPORTED_KEY] += 1;
            }
        } else if (this.lastRefreshApiCall === REFRESH_UIAPI_KEY) {
            this.refreshApiCallEventStats[UNSUPPORTED_KEY] += 1;
        }
        if (this.refreshAdapterEvents[adapterName] === undefined) {
            this.refreshAdapterEvents[adapterName] = 0;
        }
        this.refreshAdapterEvents[adapterName] += 1;
        this.lastRefreshApiCall = null;
    }

    /**
     * Increments call stat for incoming refresh api call, and sets the name
     * to be used in {@link aggregateRefreshCalls}
     * @param from The name of the refresh function called.
     */
    public handleRefreshApiCall(_apiName: keyof refreshApiNames): void {
        // TODO [W-9782972]: internal logging
        // this.refreshApiCallEventStats[apiName] += 1;
        // // set function call to be used with aggregateRefreshCalls
        // this.lastRefreshApiCall = apiName;
    }

    /**
     * W-7302241
     * Logs refresh call summary stats as a LightningInteraction.
     */
    public logRefreshStats(): void {
        // TODO [W-9782972]: internal logging
        // if (ObjectKeys(this.refreshAdapterEvents).length > 0) {
        //     interaction(
        //         REFRESH_PAYLOAD_TARGET,
        //         REFRESH_PAYLOAD_SCOPE,
        //         this.refreshAdapterEvents,
        //         REFRESH_EVENTSOURCE,
        //         REFRESH_EVENTTYPE,
        //         this.refreshApiCallEventStats
        //     );
        //     this.resetRefreshStats();
        // }
    }

    /**
     * Resets the stat trackers for refresh call events.
     */
    // private resetRefreshStats(): void {
    //     this.refreshAdapterEvents = {};
    //     this.refreshApiCallEventStats = {
    //         [REFRESH_APEX_KEY]: 0,
    //         [REFRESH_UIAPI_KEY]: 0,
    //         [SUPPORTED_KEY]: 0,
    //         [UNSUPPORTED_KEY]: 0,
    //     };
    //     this.lastRefreshApiCall = null;
    // }

    /**
     * W-7801618
     * Counter for occurrences where the incoming record to be merged has a different apiName.
     * Dynamically generated metric, stored in an {@link RecordApiNameChangeCounters} object.
     *
     * @param context The transaction context.
     *
     * Note: Short-lived metric candidate, remove at the end of 230...
     */
    public incrementRecordApiNameChangeCount(
        _incomingApiName: string,
        existingApiName: string
    ): void {
        incrementCounterMetric(
            createMetricsKey(RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME, existingApiName)
        );
    }

    /**
     * W-8620679
     * Increment the counter for an UnfulfilledSnapshotError coming from luvio
     *
     * @param context The transaction context.
     */
    private incrementAdapterRequestErrorCount(context: AdapterUnfulfilledError): void {
        // We are consolidating all apex adapter instrumentation calls under a single key
        const adapterName = normalizeAdapterName(context.adapterName);
        const adapterRequestErrorCounter = createMetricsKey(
            ADAPTER_ERROR_COUNT_METRIC_NAME,
            adapterName
        );
        observabilityInstrumentation.incrementCounter(adapterRequestErrorCounter);
        observabilityInstrumentation.incrementCounter(TOTAL_ADAPTER_ERROR_COUNT);
    }
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
        observabilityInstrumentation.incrementCounter(TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT, 1);

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

function createMetricsKey(name: string, unit?: string): string {
    let metricName = name;
    if (unit) {
        metricName = metricName + '.' + unit;
    }
    return metricName;
}

// TODO [W-9782972]: need periodic logger equivalent for our summary instrumentation
// function getStoreStats(store: Store): LdsStatsReport {
//     const { records, snapshotSubscriptions, watchSubscriptions } = store;

//     const recordCount = ObjectKeys(records).length;
//     const snapshotSubscriptionCount = ObjectKeys(snapshotSubscriptions).length;
//     const watchSubscriptionCount = ObjectKeys(watchSubscriptions).length;
//     const subscriptionCount = snapshotSubscriptionCount + watchSubscriptionCount;

//     return {
//         recordCount,
//         subscriptionCount,
//         snapshotSubscriptionCount,
//         watchSubscriptionCount,
//     };
// }

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

export function incrementAggregateUiConnectErrorCount(): void {
    incrementCounterMetric(AGGREGATE_CONNECT_ERROR_COUNT);
}

export function incrementGetRecordAggregateRetryCount(): void {
    incrementCounterMetric(GET_RECORD_AGGREGATE_RETRY_COUNT);
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

// TODO [W-9782972]: update store trim metrics
// function instrumentStoreTrimTask(callback: () => number) {
//     return () => {
//         storeTrimTaskMetric.increment(1);
//         perfStart(STORE_TRIM_TASK_NAME);
//         const startTime = Date.now();
//         const res = callback();
//         timerMetricAddDuration(storeTrimTaskTimer, Date.now() - startTime);
//         perfEnd(STORE_TRIM_TASK_NAME, { [STORE_TRIMMED_COUNT]: res });
//         return res;
//     };
// }

// function setStoreScheduler(store: Store) {
//     const originalScheduler = store.scheduler;
//     store.scheduler = (callback) => {
//         originalScheduler(instrumentStoreTrimTask(callback));
//     };
// }

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, _store: Store): void {
    instrumentMethods(luvio, ['storeBroadcast', 'storeIngest', 'storeLookup']);
    // TODO [W-9782972]: update back to supplying a metric key
    // [
    //     { methodName: 'storeBroadcast', metricKey: STORE_BROADCAST_DURATION },
    //     { methodName: 'storeIngest', metricKey: STORE_INGEST_DURATION },
    //     { methodName: 'storeLookup', metricKey: STORE_LOOKUP_DURATION },
    // ]

    // setStoreScheduler(store);

    // TODO [W-9782972]: need periodic logger equivalent for our summary instrumentation
    // registerPeriodicLogger(NAMESPACE, () => {
    //     const storeStats = getStoreStats(store);
    //     instrumentationServiceMark(NAMESPACE, STORE_STATS_MARK_NAME, storeStats);
    //     storeSizeMetric.update(storeStats.recordCount);
    //     storeSnapshotSubscriptionsMetric.update(storeStats.snapshotSubscriptionCount);
    //     storeWatchSubscriptionsMetric.update(storeStats.watchSubscriptionCount);
    // });
}

/**
 * @param instrumentedAdapter
 * @returns instrumentedGraphqlAdapter, which logs additional metrics for get graphQL adapter
 */
export function instrumentGraphqlAdapter<C, D>(instrumentedAdapter: Adapter<C, D>): Adapter<C, D> {
    const instrumentedGraphqlAdapter = (config: C) => {
        const result = instrumentedAdapter(config);

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

export const instrumentation = new Instrumentation();
