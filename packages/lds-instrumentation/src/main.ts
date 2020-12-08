import { Luvio, Store, Adapter, Snapshot } from '@luvio/engine';
import { REFRESH_ADAPTER_EVENT } from '@luvio/lwc-luvio';
import {
    CacheStatsLogger,
    Counter,
    counter,
    interaction,
    mark as instrumentationServiceMark,
    markEnd,
    markStart,
    MetricsKey,
    MetricsServiceMark,
    MetricsServicePlugin,
    percentileHistogram,
    perfStart,
    perfEnd,
    registerCacheStats,
    registerPeriodicLogger,
    registerPlugin,
    time,
    timer,
    Timer,
} from 'instrumentation/service';

import {
    AGGREGATE_UI_CHUNK_COUNT,
    CACHE_HIT_COUNT,
    CACHE_MISS_COUNT,
    GET_RECORD_AGGREGATE_INVOKE_COUNT,
    GET_RECORD_NORMAL_INVOKE_COUNT,
    GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT,
    GET_RECORD_NOTIFY_CHANGE_DROP_COUNT,
    NETWORK_RATE_LIMIT_EXCEEDED_COUNT,
    STORE_BROADCAST_DURATION,
    STORE_INGEST_DURATION,
    STORE_LOOKUP_DURATION,
    STORE_SIZE_COUNT,
    STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT,
    STORE_WATCH_SUBSCRIPTIONS_COUNT,
} from './metric-keys';

import { ObjectKeys } from './utils/language';
import { LRUCache } from './utils/lru-cache';
import { stableJSONStringify } from './utils/utils';

import {
    getLayoutConfigKey,
    getLayoutUserStateConfigKey,
    getListUiConfigKey,
    getLookupActionsConfigKey,
    getLookupRecordsConfigKey,
    getObjectInfoConfigKey,
    getPicklistValuesConfigKey,
    getPicklistValuesByRecordTypeConfigKey,
    getRecordAvatarsConfigKey,
    getRecordCreateDefaultsConfigKey,
    getRecordConfigKey,
    getRecordUiConfigKey,
} from './config-key-functions';

interface RecordApiNameChangeCounters {
    [apiName: string]: Counter;
}

const RECORD_API_NAME_CHANGE_EVENT = 'record-api-name-change-event';
interface RecordApiNameChangeEvent {
    [RECORD_API_NAME_CHANGE_EVENT]: boolean;
    existingApiName: string;
    incomingApiName: string;
}
// Event comes in from lwc-luvio package
interface RefreshAdapterEvent {
    [REFRESH_ADAPTER_EVENT]: boolean;
    adapterName: string;
}

const APEX_ADAPTER_NAME = 'getApex';
interface RefreshAdapterEvents {
    [adapterName: string]: number;
}

export const REFRESH_APEX_KEY = 'refreshApex';
export const REFRESH_UIAPI_KEY = 'refreshUiApi';
const SUPPORTED_KEY = 'refreshSupported';
const UNSUPPORTED_KEY = 'refreshUnsupported';

const REFRESH_EVENTSOURCE = 'lds-refresh-summary';
const REFRESH_EVENTTYPE = 'system';
const REFRESH_PAYLOAD_TARGET = 'adapters';
const REFRESH_PAYLOAD_SCOPE = 'luvio';

interface RefreshApiCallEventStats {
    [REFRESH_APEX_KEY]: number;
    [REFRESH_UIAPI_KEY]: number;
    [SUPPORTED_KEY]: number;
    [UNSUPPORTED_KEY]: number;
}
const REFRESH_API_CALL_EVENT = 'refresh-api-call-event';
export type refreshApiNames = {
    refreshApex: string;
    refreshUiApi: string;
};
interface RefreshApiCallEvent {
    [REFRESH_API_CALL_EVENT]: boolean;
    apiName: keyof refreshApiNames;
}

interface LdsStatsReport {
    recordCount: number;
    subscriptionCount: number;
    snapshotSubscriptionCount: number;
    watchSubscriptionCount: number;
}

const INCOMING_WEAKETAG_0_KEY = 'incoming-weaketag-0';
const EXISTING_WEAKETAG_0_KEY = 'existing-weaketag-0';

interface WeakETagZeroEvent {
    apiName: string;
    [EXISTING_WEAKETAG_0_KEY]: boolean;
    [INCOMING_WEAKETAG_0_KEY]: boolean;
}

interface WeakEtagZeroEvents {
    [apiName: string]: {
        [EXISTING_WEAKETAG_0_KEY]: number;
        [INCOMING_WEAKETAG_0_KEY]: number;
    };
}

interface wireAdapterMetricConfigs {
    [name: string]: {
        ttl: number;
        wireConfigKeyFn: (config: any) => string;
    };
}

const NAMESPACE = 'luvio';
const STORE_STATS_MARK_NAME = 'store-stats';
const RUNTIME_PERF_MARK_NAME = 'runtime-perf';
const NETWORK_TRANSACTION_NAME = 'lds-network';

const ADAPTER_CACHE_HIT_COUNT_METRIC_NAME = 'cache-hit-count';
const ADAPTER_CACHE_HIT_DURATION_METRIC_NAME = 'cache-hit-duration';
const ADAPTER_CACHE_MISS_COUNT_METRIC_NAME = 'cache-miss-count';
const ADAPTER_CACHE_MISS_DURATION_METRIC_NAME = 'cache-miss-duration';
const ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME = 'cache-miss-out-of-ttl-duration';
const RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME = 'record-api-name-change-count';
const aggregateUiChunkCountMetric = percentileHistogram(AGGREGATE_UI_CHUNK_COUNT);
const cacheHitMetric = counter(CACHE_HIT_COUNT);
const cacheMissMetric = counter(CACHE_MISS_COUNT);
const getRecordAggregateInvokeMetric = counter(GET_RECORD_AGGREGATE_INVOKE_COUNT);
const getRecordNormalInvokeMetric = counter(GET_RECORD_NORMAL_INVOKE_COUNT);
const getRecordNotifyChangeAllowMetric = counter(GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT);
const getRecordNotifyChangeDropMetric = counter(GET_RECORD_NOTIFY_CHANGE_DROP_COUNT);
const networkRateLimitExceededCountMetric = counter(NETWORK_RATE_LIMIT_EXCEEDED_COUNT);
const storeSizeMetric = percentileHistogram(STORE_SIZE_COUNT);
const storeWatchSubscriptionsMetric = percentileHistogram(STORE_WATCH_SUBSCRIPTIONS_COUNT);
const storeSnapshotSubscriptionsMetric = percentileHistogram(STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT);

const wireAdapterMetricConfigs: wireAdapterMetricConfigs = {
    getLayout: {
        ttl: 900000,
        wireConfigKeyFn: getLayoutConfigKey,
    },
    getLayoutUserState: {
        ttl: 900000,
        wireConfigKeyFn: getLayoutUserStateConfigKey,
    },
    getListUi: {
        ttl: 900000,
        wireConfigKeyFn: getListUiConfigKey,
    },
    getLookupActions: {
        ttl: 300000,
        wireConfigKeyFn: getLookupActionsConfigKey,
    },
    getLookupRecords: {
        ttl: 30000,
        wireConfigKeyFn: getLookupRecordsConfigKey,
    },
    getObjectInfo: {
        ttl: 900000,
        wireConfigKeyFn: getObjectInfoConfigKey,
    },
    getPicklistValues: {
        ttl: 300000,
        wireConfigKeyFn: getPicklistValuesConfigKey,
    },
    getPicklistValuesByRecordType: {
        ttl: 300000,
        wireConfigKeyFn: getPicklistValuesByRecordTypeConfigKey,
    },
    getRecord: {
        ttl: 30000,
        wireConfigKeyFn: getRecordConfigKey,
    },
    getRecordAvatars: {
        ttl: 300000,
        wireConfigKeyFn: getRecordAvatarsConfigKey,
    },
    getRecordCreateDefaults: {
        ttl: 900000,
        wireConfigKeyFn: getRecordCreateDefaultsConfigKey,
    },
    getRecordUi: {
        ttl: 900000,
        wireConfigKeyFn: getRecordUiConfigKey,
    },
};

export class Instrumentation {
    private recordApiNameChangeCounters: RecordApiNameChangeCounters = {};
    private refreshAdapterEvents: RefreshAdapterEvents = {};
    private refreshApiCallEventStats: RefreshApiCallEventStats = {
        [REFRESH_APEX_KEY]: 0,
        [REFRESH_UIAPI_KEY]: 0,
        [SUPPORTED_KEY]: 0,
        [UNSUPPORTED_KEY]: 0,
    };
    private lastRefreshApiCall: keyof refreshApiNames | null = null;
    private weakEtagZeroEvents: WeakEtagZeroEvents = {};
    private adapterCacheMisses: LRUCache = new LRUCache(250);

    constructor() {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('beforeunload', () => {
                if (ObjectKeys(this.weakEtagZeroEvents).length > 0) {
                    perfStart(NETWORK_TRANSACTION_NAME);
                    perfEnd(NETWORK_TRANSACTION_NAME, this.weakEtagZeroEvents);
                }
            });
        }
        registerPeriodicLogger(NAMESPACE, this.logRefreshStats.bind(this));
    }

    /**
     * Instruments an existing adapter to log argus metrics and cache stats.
     * @param name The adapter name.
     * @param adapter The adapter function.
     * @param wireConfigKeyFn Optional function to transform wire configs to a unique key.
     * @returns The wrapped adapter.
     */
    public instrumentAdapter<C, D>(name: string, adapter: Adapter<C, D>): Adapter<C, D> {
        const stats = registerLdsCacheStats(name);
        /**
         * W-6981216
         * Dynamically generated metric. Simple counter for cache hits by adapter name.
         */
        const cacheHitCountByAdapterMetric = counter(
            createMetricsKey(NAMESPACE, ADAPTER_CACHE_HIT_COUNT_METRIC_NAME, name)
        );

        /**
         * W-7404607
         * Dynamically generated metric. Timer for cache hits by adapter name.
         */
        const cacheHitDurationByAdapterMetric = timer(
            createMetricsKey(NAMESPACE, ADAPTER_CACHE_HIT_DURATION_METRIC_NAME, name)
        );

        /**
         * W-6981216
         * Dynamically generated metric. Simple counter for cache misses by adapter name.
         */
        const cacheMissCountByAdapterMetric = counter(
            createMetricsKey(NAMESPACE, ADAPTER_CACHE_MISS_COUNT_METRIC_NAME, name)
        );

        /**
         * W-7404607
         * Dynamically generated metric. Timer for cache hits by adapter name.
         */
        const cacheMissDurationByAdapterMetric = timer(
            createMetricsKey(NAMESPACE, ADAPTER_CACHE_MISS_DURATION_METRIC_NAME, name)
        );

        /**
         * W-7376275
         * Dynamically generated metric. Measures the amount of time it takes for LDS to get another cache miss on
         * a request we've made in the past.
         *
         * Request Record 1 -> Record 2 -> Back to Record 1 outside of TTL is an example of when this metric will fire.
         */
        const wireAdapterMetricConfig = wireAdapterMetricConfigs[name];
        const cacheMissOutOfTtlDurationByAdapterMetric: Timer | undefined =
            (wireAdapterMetricConfig && wireAdapterMetricConfig.ttl) !== undefined
                ? timer(
                      createMetricsKey(
                          NAMESPACE,
                          ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME,
                          name
                      )
                  )
                : undefined;

        const instrumentedAdapter = (config: C) => {
            const startTime = Date.now();
            const result = adapter(config);
            // In the case where the adapter returns a Snapshot it is constructed out of the store
            // (cache hit) whereas a Promise<Snapshot> indicates a network request (cache miss).
            //
            // Note: we can't do a plain instanceof check for a promise here since the Promise may
            // originate from another javascript realm (for example: in jest test). Instead we use a
            // duck-typing approach by checking is the result has a then property.
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
            if (result !== null && 'then' in result!) {
                (result as Promise<Snapshot<D>>).then((_snapshot: Snapshot<D>) => {
                    timerMetricAddDuration(
                        cacheMissDurationByAdapterMetric,
                        Date.now() - startTime
                    );
                });
                stats.logMisses();
                cacheMissMetric.increment(1);
                cacheMissCountByAdapterMetric.increment(1);

                if (cacheMissOutOfTtlDurationByAdapterMetric !== undefined) {
                    this.logAdapterCacheMissOutOfTtlDuration(
                        config,
                        cacheMissOutOfTtlDurationByAdapterMetric,
                        Date.now(),
                        wireAdapterMetricConfig.ttl,
                        wireAdapterMetricConfig.wireConfigKeyFn
                    );
                }
            } else if (result !== null) {
                stats.logHits();
                cacheHitMetric.increment(1);
                cacheHitCountByAdapterMetric.increment(1);
                timerMetricAddDuration(cacheHitDurationByAdapterMetric, Date.now() - startTime);
            }
            return result;
        };
        // Set the name property on the function for debugging purposes.
        Object.defineProperty(instrumentedAdapter, 'name', { value: name + '__instrumented' });
        return instrumentedAdapter;
    }

    /**
     * Logs when adapter requests come in. If we have subsequent cache misses on a given config, above its TTL then log the duration to metrics.
     * Backed by an LRU Cache implementation to prevent too many record entries from being stored in-memory.
     * @param config The config passed into wire adapter.
     * @param name The wire adapter name.
     * @param metric The argus timer metric for tracking cache miss durations.
     * @param currentCacheMissTimestamp Timestamp for when the request was made.
     * @param ttl TTL for the wire adapter.
     * @param wireConfigKeyFn Optional function to transform wire configs to a unique key. Otherwise, defaults to use stableJSONStringify().
     */
    private logAdapterCacheMissOutOfTtlDuration(
        config: unknown,
        metric: Timer,
        currentCacheMissTimestamp: number,
        ttl: number,
        wireConfigKeyFn: (config: any) => string
    ): void {
        const configKey = wireConfigKeyFn
            ? wireConfigKeyFn(config)
            : (stableJSONStringify(config) as string);
        const existingCacheMissTimestamp = this.adapterCacheMisses.get(configKey);
        this.adapterCacheMisses.set(configKey, currentCacheMissTimestamp);
        if (existingCacheMissTimestamp !== undefined) {
            const duration = currentCacheMissTimestamp - existingCacheMissTimestamp;
            if (duration > ttl) {
                metric.addDuration(duration);
            }
        }
    }

    /**
     * Add a network transaction to the metrics service.
     * Injected to LDS for network handling instrumentation.
     *
     * @param context The transaction context.
     */

    public instrumentNetwork(context: unknown): void {
        if (this.isWeakETagEvent(context)) {
            this.aggregateWeakETagEvents(context);
        } else if (this.isRefreshAdapterEvent(context)) {
            this.aggregateRefreshAdapterEvents(context);
        } else if (this.isRecordApiNameChangeEvent(context)) {
            this.incrementRecordApiNameChangeCount(context);
        } else if (this.isRefreshApiEvent(context)) {
            this.handleRefreshApiCall(context);
        } else {
            perfStart(NETWORK_TRANSACTION_NAME);
            perfEnd(NETWORK_TRANSACTION_NAME, context);
        }
    }

    /**
     * Returns whether or not this is a recordApiNameChangeEvent.
     * @param context The transaction context.
     * @returns Whether or not this is a recordApiNameChangeEvent.
     */
    private isRecordApiNameChangeEvent(context: unknown): context is RecordApiNameChangeEvent {
        return (context as any)[RECORD_API_NAME_CHANGE_EVENT] === true;
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
     * Returns whether or not this is a RefreshApiCallEvent.
     * @param context The transaction context.
     * @returns Whether or not this is a RefreshApexEvent.
     */
    private isRefreshApiEvent(context: unknown): context is RefreshApiCallEvent {
        return (context as RefreshApiCallEvent)[REFRESH_API_CALL_EVENT] === true;
    }

    /**
     * Returns via duck-typing whether or not this is a weakETagZeroEvent.
     * @param context The transaction context.
     * @returns Whether or not this is a weakETagZeroEvent.
     */
    private isWeakETagEvent(context: unknown): context is WeakETagZeroEvent {
        return (
            typeof (context as any)[EXISTING_WEAKETAG_0_KEY] === 'boolean' &&
            typeof (context as any)[INCOMING_WEAKETAG_0_KEY] === 'boolean'
        );
    }

    /**
     * Parses and aggregates weakETagZero events to be sent in summarized log line.
     * @param context The transaction context.
     */
    private aggregateWeakETagEvents(context: WeakETagZeroEvent): void {
        const { apiName } = context;
        const key = 'weaketag-0-' + apiName;
        if (this.weakEtagZeroEvents[key] === undefined) {
            this.weakEtagZeroEvents[key] = {
                [EXISTING_WEAKETAG_0_KEY]: 0,
                [INCOMING_WEAKETAG_0_KEY]: 0,
            };
        }
        if (context[EXISTING_WEAKETAG_0_KEY] !== undefined) {
            this.weakEtagZeroEvents[key][EXISTING_WEAKETAG_0_KEY] += 1;
        }
        if (context[INCOMING_WEAKETAG_0_KEY] !== undefined) {
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
        let { adapterName } = context;
        // We are consolidating all apex adapter refresh calls under a single key
        if (this.isApexAdapter(adapterName)) {
            adapterName = APEX_ADAPTER_NAME;
        }
        if (this.lastRefreshApiCall === REFRESH_APEX_KEY) {
            if (adapterName === APEX_ADAPTER_NAME) {
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
    private handleRefreshApiCall(context: RefreshApiCallEvent): void {
        const { apiName } = context;
        this.refreshApiCallEventStats[apiName] += 1;
        // set function call to be used with aggregateRefreshCalls
        this.lastRefreshApiCall = apiName;
    }

    /**
     * W-7302241
     * Logs refresh call summary stats as a LightningInteraction.
     */
    public logRefreshStats(): void {
        if (ObjectKeys(this.refreshAdapterEvents).length > 0) {
            interaction(
                REFRESH_PAYLOAD_TARGET,
                REFRESH_PAYLOAD_SCOPE,
                this.refreshAdapterEvents,
                REFRESH_EVENTSOURCE,
                REFRESH_EVENTTYPE,
                this.refreshApiCallEventStats
            );
            this.resetRefreshStats();
        }
    }

    /**
     * Returns whether the refresh event is on a supported adapter or not.
     * @param adapterName The name of the adapter refresh was called on.
     */
    private isApexAdapter(adapterName: string): boolean {
        return adapterName.indexOf(APEX_ADAPTER_NAME) === 0;
    }

    /**
     * Resets the stat trackers for refresh call events.
     */
    private resetRefreshStats(): void {
        this.refreshAdapterEvents = {};
        this.refreshApiCallEventStats = {
            [REFRESH_APEX_KEY]: 0,
            [REFRESH_UIAPI_KEY]: 0,
            [SUPPORTED_KEY]: 0,
            [UNSUPPORTED_KEY]: 0,
        };
        this.lastRefreshApiCall = null;
    }

    /**
     * W-7801618
     * Counter for occurrences where the incoming record to be merged has a different apiName.
     * Dynamically generated metric, stored in an {@link RecordApiNameChangeCounters} object.
     *
     * @param context The transaction context.
     *
     * Note: Short-lived metric candidate, remove at the end of 230
     */
    private incrementRecordApiNameChangeCount(context: RecordApiNameChangeEvent): void {
        const { existingApiName: apiName } = context;
        let apiNameChangeCounter = this.recordApiNameChangeCounters[apiName];
        if (apiNameChangeCounter === undefined) {
            apiNameChangeCounter = counter(
                createMetricsKey(NAMESPACE, RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME, apiName)
            );
            this.recordApiNameChangeCounters[apiName] = apiNameChangeCounter;
        }
        apiNameChangeCounter.increment(1);
    }
}
/**
 * Aura Metrics Service plugin in charge of aggregating all the LDS performance marks before they
 * get sent to the server. All the marks are summed by operation type and the aggregated result
 * is then stored an a new mark.
 */
const markAggregatorPlugin: MetricsServicePlugin = {
    name: NAMESPACE,
    enabled: true,
    initialize() {
        /* noop */
    },
    postProcess(marks: MetricsServiceMark[]): MetricsServiceMark[] {
        const postProcessedMarks: MetricsServiceMark[] = [];

        let shouldLogAggregated = false;
        const startTs: Record<string, number> = {};
        const aggregated: Record<string, number> = {};

        for (let i = 0, len = marks.length; i < len; i++) {
            const mark = marks[i];
            const { name, phase, ts } = mark;

            if (phase === 'start') {
                startTs[name] = ts;
            } else if (phase === 'end') {
                if (aggregated[name] === undefined) {
                    aggregated[name] = 0;
                }

                shouldLogAggregated = true;
                aggregated[name] += ts - startTs[name];
            } else {
                postProcessedMarks.push(mark);
            }
        }

        if (shouldLogAggregated) {
            postProcessedMarks.push({
                ns: NAMESPACE,
                name: RUNTIME_PERF_MARK_NAME,
                phase: 'stamp',
                ts: time(),
                context: aggregated,
            });
        }

        return postProcessedMarks;
    },
};

function instrumentMethod(
    obj: any,
    methods: { methodName: string; metricKey: MetricsKey }[]
): void {
    for (let i = 0, len = methods.length; i < len; i++) {
        const method = methods[i];
        const methodName = method.methodName;
        const originalMethod = obj[methodName];
        const methodTimer = timer(method.metricKey);

        obj[methodName] = function(...args: any[]): any {
            markStart(NAMESPACE, methodName);
            const startTime = Date.now();
            const res = originalMethod.call(this, ...args);
            timerMetricAddDuration(methodTimer, Date.now() - startTime);
            markEnd(NAMESPACE, methodName);

            return res;
        };
    }
}

function createMetricsKey(owner: string, name: string, unit?: string): MetricsKey {
    let metricName = name;
    if (unit) {
        metricName = metricName + '.' + unit;
    }
    return {
        get() {
            return { owner: owner, name: metricName };
        },
    };
}

export function timerMetricAddDuration(timer: Timer, duration: number): void {
    // Guard against negative values since it causes error to be thrown by MetricsService
    if (duration >= 0) {
        timer.addDuration(duration);
    }
}

function getStoreStats(store: Store): LdsStatsReport {
    const { records, snapshotSubscriptions, watchSubscriptions } = store;

    const recordCount = ObjectKeys(records).length;
    const snapshotSubscriptionCount = ObjectKeys(snapshotSubscriptions).length;
    const watchSubscriptionCount = ObjectKeys(watchSubscriptions).length;
    const subscriptionCount = snapshotSubscriptionCount + watchSubscriptionCount;

    return {
        recordCount,
        subscriptionCount,
        snapshotSubscriptionCount,
        watchSubscriptionCount,
    };
}

/**
 * Add a mark to the metrics service.
 *
 * @param name The mark name.
 * @param content The mark content.
 */
export function mark(name: string, content?: any) {
    instrumentationServiceMark(NAMESPACE, name, content);
}

/**
 * Create a new instrumentation cache stats and return it.
 *
 * @param name The cache logger name.
 */
export function registerLdsCacheStats(name: string): CacheStatsLogger {
    return registerCacheStats(`${NAMESPACE}:${name}`);
}

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, store: Store): void {
    registerPlugin({
        name: NAMESPACE,
        plugin: markAggregatorPlugin,
    });

    instrumentMethod(luvio, [
        { methodName: 'storeBroadcast', metricKey: STORE_BROADCAST_DURATION },
        { methodName: 'storeIngest', metricKey: STORE_INGEST_DURATION },
        { methodName: 'storeLookup', metricKey: STORE_LOOKUP_DURATION },
    ]);

    registerPeriodicLogger(NAMESPACE, () => {
        const storeStats = getStoreStats(store);
        instrumentationServiceMark(NAMESPACE, STORE_STATS_MARK_NAME, storeStats);
        storeSizeMetric.update(storeStats.recordCount);
        storeSnapshotSubscriptionsMetric.update(storeStats.snapshotSubscriptionCount);
        storeWatchSubscriptionsMetric.update(storeStats.watchSubscriptionCount);
    });
}

export function setAggregateUiChunkCountMetric(chunkCount: number): void {
    aggregateUiChunkCountMetric.update(chunkCount);
}

export function incrementGetRecordNormalInvokeCount(): void {
    getRecordNormalInvokeMetric.increment(1);
}

export function incrementGetRecordAggregateInvokeCount(): void {
    getRecordAggregateInvokeMetric.increment(1);
}

export function incrementGetRecordNotifyChangeAllowCount(): void {
    getRecordNotifyChangeAllowMetric.increment(1);
}

export function incrementGetRecordNotifyChangeDropCount(): void {
    getRecordNotifyChangeDropMetric.increment(1);
}

export function incrementNetworkRateLimitExceededCount(): void {
    networkRateLimitExceededCountMetric.increment(1);
}

/**
 * Note: locator.scope is set to 'force_record' in order for the instrumentation gate to work, which will
 * disable all crud operations if it is on.
 * @param eventSource - Source of the logging event.
 * @param attributes - Free form object of attributes to log.
 */
export function logCRUDLightningInteraction(eventSource: string, attributes: object): void {
    interaction(eventSource, 'force_record', null, eventSource, 'crud', attributes);
}

// TODO: export these types from luvio/engine
type Instrument = (params: unknown) => void;
type InstrumentParamsBuilder = () => Parameters<Instrument>[0];
/**
 * @returns The builder function for specified api call.
 */
export function refreshApiEvent(apiName: keyof refreshApiNames): InstrumentParamsBuilder {
    return () => {
        return {
            [REFRESH_API_CALL_EVENT]: true,
            apiName,
        };
    };
}

export const instrumentation = new Instrumentation();
