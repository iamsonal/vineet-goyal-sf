import type {
    FetchResponse,
    Luvio,
    Store,
    Adapter,
    UnfulfilledSnapshot,
    HttpStatusCode,
} from '@luvio/engine';
import { REFRESH_ADAPTER_EVENT, ADAPTER_UNFULFILLED_ERROR } from '@salesforce/lds-bindings';
import type { CacheStatsLogger, Counter, MetricsKey, Timer } from 'instrumentation/service';
import {
    counter,
    interaction,
    mark as instrumentationServiceMark,
    perfStart,
    perfEnd,
    registerCacheStats,
    registerPeriodicLogger,
    timer,
} from 'instrumentation/service';
import {
    incrementCounterMetric,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    instrumentAdapter as o11yInstrumentAdapter,
    instrumentLuvio as o11yInstrumentLuvio,
    updatePercentileHistogramMetric,
    LRUCache,
    setupInstrumentation as ldsInstrumentationSetupInstrumentation,
} from '@salesforce/lds-instrumentation';
import { instrument as adaptersUiApiInstrument } from '@salesforce/lds-adapters-uiapi';
import { instrument as networkAdapterInstrument } from '@salesforce/lds-network-adapter';
import {
    instrument as networkAuraInstrument,
    forceRecordTransactionsDisabled,
} from '@salesforce/lds-network-aura';
import { instrument as lwcBindingsInstrument } from '@salesforce/lds-bindings';
import { instrument as adsBridgeInstrument } from '@salesforce/lds-ads-bridge';

import {
    OBSERVABILITY_NAMESPACE,
    ADAPTER_INVOCATION_COUNT_METRIC_NAME,
    ADAPTER_ERROR_COUNT_METRIC_NAME,
    GET_APEX_REQUEST_COUNT,
    NETWORK_ADAPTER_RESPONSE_METRIC_NAME,
    TOTAL_ADAPTER_ERROR_COUNT,
    TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT,
} from './utils/observability';

import { ObjectKeys, ObjectCreate } from './utils/language';
import { isPromise, stableJSONStringify } from './utils/utils';

interface AdapterUnfulfilledErrorCounters {
    [apiName: string]: Counter;
}

export interface AdapterUnfulfilledError {
    [ADAPTER_UNFULFILLED_ERROR]: boolean;
    adapterName: string;
    missingPaths: UnfulfilledSnapshot<any, any>['missingPaths'];
    missingLinks: UnfulfilledSnapshot<any, any>['missingLinks'];
}

export const APEX_ADAPTER_NAME = 'getApex';
export const NORMALIZED_APEX_ADAPTER_NAME = `Apex.${APEX_ADAPTER_NAME}`;

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

const REFRESH_EVENTSOURCE = 'lds-refresh-summary';
const REFRESH_EVENTTYPE = 'system';
const REFRESH_PAYLOAD_TARGET = 'adapters';
const REFRESH_PAYLOAD_SCOPE = 'lds';

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

const RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME = 'record-api-name-change-count';
interface RecordApiNameChangeCounters {
    [apiName: string]: Counter;
}

export interface LightningInteractionSchema {
    target: string;
    scope: string;
    context: unknown;
    eventSource: string;
    eventType: string;
    attributes: unknown;
}

const NAMESPACE = 'lds';
const NETWORK_TRANSACTION_NAME = 'lds-network';

const CACHE_STATS_OUT_OF_TTL_MISS_POSTFIX = 'out-of-ttl-miss';

// Aggregate Cache Stats and Metrics for all getApex invocations
const getApexCacheStats = registerLdsCacheStats(NORMALIZED_APEX_ADAPTER_NAME);
const getApexTtlCacheStats = registerLdsCacheStats(
    NORMALIZED_APEX_ADAPTER_NAME + ':' + CACHE_STATS_OUT_OF_TTL_MISS_POSTFIX
);

// Observability (READS)
const getApexRequestCountMetric = counter(GET_APEX_REQUEST_COUNT);
const totalAdapterRequestSuccessMetric = counter(TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT);
const totalAdapterErrorMetric = counter(TOTAL_ADAPTER_ERROR_COUNT);

export class Instrumentation {
    private adapterUnfulfilledErrorCounters: AdapterUnfulfilledErrorCounters = {};
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
     * @param adapter The adapter function.
     * @param metadata The adapter metadata.
     * @param wireConfigKeyFn Optional function to transform wire configs to a unique key.
     * @returns The wrapped adapter.
     */
    public instrumentAdapter<C, D>(
        adapter: Adapter<C, D>,
        metadata: AdapterMetadata
    ): Adapter<C, D> {
        // We are consolidating all apex adapter instrumentation calls under a single key
        const { apiFamily, name, ttl } = metadata;
        const adapterName = normalizeAdapterName(name, apiFamily);
        const isGetApexAdapter = isApexAdapter(name);

        const stats = isGetApexAdapter ? getApexCacheStats : registerLdsCacheStats(adapterName);
        const ttlMissStats = isGetApexAdapter
            ? getApexTtlCacheStats
            : registerLdsCacheStats(adapterName + ':' + CACHE_STATS_OUT_OF_TTL_MISS_POSTFIX);

        /**
         * W-8076905
         * Dynamically generated metric. Simple counter for all requests made by this adapter.
         */
        const wireAdapterRequestMetric = isGetApexAdapter
            ? getApexRequestCountMetric
            : counter(
                  createMetricsKey(
                      OBSERVABILITY_NAMESPACE,
                      ADAPTER_INVOCATION_COUNT_METRIC_NAME,
                      adapterName
                  )
              );

        const instrumentedAdapter = (config: C) => {
            // increment overall and adapter request metrics
            wireAdapterRequestMetric.increment(1);
            totalAdapterRequestSuccessMetric.increment(1);

            // execute adapter logic
            const result = adapter(config);
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
                stats.logMisses();

                if (ttl !== undefined) {
                    this.logAdapterCacheMissOutOfTtlDuration(
                        adapterName,
                        config,
                        ttlMissStats,
                        Date.now(),
                        ttl
                    );
                }
            } else if (result !== null) {
                stats.logHits();
            }

            return result;
        };
        // Set the name property on the function for debugging purposes.
        Object.defineProperty(instrumentedAdapter, 'name', {
            value: name + '__instrumented',
        });
        return o11yInstrumentAdapter(instrumentedAdapter, metadata);
    }

    /**
     * Logs when adapter requests come in. If we have subsequent cache misses on a given config, beyond its TTL then log the duration to metrics.
     * Backed by an LRU Cache implementation to prevent too many record entries from being stored in-memory.
     * @param name The wire adapter name.
     * @param config The config passed into wire adapter.
     * @param ttlMissStats CacheStatsLogger to log misses out of TTL.
     * @param currentCacheMissTimestamp Timestamp for when the request was made.
     * @param ttl TTL for the wire adapter.
     */
    private logAdapterCacheMissOutOfTtlDuration(
        name: string,
        config: unknown,
        ttlMissStats: CacheStatsLogger,
        currentCacheMissTimestamp: number,
        ttl: number
    ): void {
        const configKey = `${name}:${stableJSONStringify(config)}`;
        const existingCacheMissTimestamp = this.adapterCacheMisses.get(configKey);
        this.adapterCacheMisses.set(configKey, currentCacheMissTimestamp);
        if (existingCacheMissTimestamp !== undefined) {
            const duration = currentCacheMissTimestamp - existingCacheMissTimestamp;
            if (duration > ttl) {
                ttlMissStats.logMisses();
            }
        }
    }

    /**
     * Injected to LDS for Luvio specific instrumentation.
     *
     * @param context The transaction context.
     */
    public instrumentLuvio(context: unknown): void {
        o11yInstrumentLuvio(context);

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
    public notifyChangeNetwork(uniqueWeakEtags: boolean | null, error?: boolean) {
        perfStart(NETWORK_TRANSACTION_NAME);
        if (error === true) {
            perfEnd(NETWORK_TRANSACTION_NAME, { 'notify-change-network': 'error' });
        } else {
            perfEnd(NETWORK_TRANSACTION_NAME, { 'notify-change-network': uniqueWeakEtags });
        }
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
    public handleRefreshApiCall(apiName: keyof refreshApiNames): void {
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
    public incrementRecordApiNameChangeCount(
        _incomingApiName: string,
        existingApiName: string
    ): void {
        let apiNameChangeCounter = this.recordApiNameChangeCounters[existingApiName];
        if (apiNameChangeCounter === undefined) {
            apiNameChangeCounter = counter(
                createMetricsKey(
                    NAMESPACE,
                    RECORD_API_NAME_CHANGE_COUNT_METRIC_NAME,
                    existingApiName
                )
            );
            this.recordApiNameChangeCounters[existingApiName] = apiNameChangeCounter;
        }
        apiNameChangeCounter.increment(1);
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
        let adapterRequestErrorCounter = this.adapterUnfulfilledErrorCounters[adapterName];
        if (adapterRequestErrorCounter === undefined) {
            adapterRequestErrorCounter = counter(
                createMetricsKey(
                    OBSERVABILITY_NAMESPACE,
                    ADAPTER_ERROR_COUNT_METRIC_NAME,
                    adapterName
                )
            );
            this.adapterUnfulfilledErrorCounters[adapterName] = adapterRequestErrorCounter;
        }
        adapterRequestErrorCounter.increment(1);
        totalAdapterErrorMetric.increment(1);
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

/**
 * Returns whether adapter is an Apex one or not.
 * @param adapterName The name of the adapter.
 */
function isApexAdapter(adapterName: string): boolean {
    return adapterName.indexOf(APEX_ADAPTER_NAME) > -1;
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
 * Calls instrumentation/service interaction API. Function name and parameters mapped to `o11y`
 * implementation for Log Lines.
 * @param schema Expected shape of the payload (Currently unused)
 * @param payload Content to be logged, shape matches schema
 */
export function log(_schema: any, payload: LightningInteractionSchema): void {
    const { target, scope, context, eventSource, eventType, attributes } = payload;
    interaction(target, scope, context, eventSource, eventType, attributes);
}

const timerMetricTracker: Record<string, Timer> = ObjectCreate(null);
/**
 * Calls instrumentation/service telemetry timer
 * @param name Name of the metric
 * @param duration number to update backing percentile histogram, negative numbers ignored
 */
export function updateTimerMetric(name: string, duration: number): void {
    let metric = timerMetricTracker[name];
    if (metric === undefined) {
        metric = timer(createMetricsKey(NAMESPACE, name));
        timerMetricTracker[name] = metric;
    }
    timerMetricAddDuration(metric, duration);
}

export function timerMetricAddDuration(timer: Timer, duration: number) {
    // Guard against negative values since it causes error to be thrown by MetricsService
    if (duration >= 0) {
        timer.addDuration(duration);
    }
}

/**
 * W-10315098
 * Increments the counter associated with the request response. Counts are bucketed by status.
 */
const requestResponseMetricTracker: Record<HttpStatusCode, Counter> = ObjectCreate(null);
export function incrementRequestResponseCount(cb: () => FetchResponse<unknown>) {
    const status = cb().status;
    let metric = requestResponseMetricTracker[status];
    if (metric === undefined) {
        metric = counter(
            createMetricsKey(
                OBSERVABILITY_NAMESPACE,
                NETWORK_ADAPTER_RESPONSE_METRIC_NAME,
                `${status.valueOf()}`
            )
        );
        requestResponseMetricTracker[status] = metric;
    }
    metric.increment();
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
 * Add or overwrite hooks that require aura implementations
 */
export function setAuraInstrumentationHooks() {
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
        recordApiNameChanged:
            instrumentation.incrementRecordApiNameChangeCount.bind(instrumentation),
        weakEtagZero: instrumentation.aggregateWeakETagEvents.bind(instrumentation),
        getRecordNotifyChangeNetworkResult:
            instrumentation.notifyChangeNetwork.bind(instrumentation),
    });
    networkAuraInstrument({
        logCrud: logCRUDLightningInteraction,
        networkResponse: incrementRequestResponseCount,
    });
    lwcBindingsInstrument({
        refreshCalled: instrumentation.handleRefreshApiCall.bind(instrumentation),
        instrumentAdapter: instrumentation.instrumentAdapter.bind(instrumentation),
    });
    adsBridgeInstrument({
        timerMetricAddDuration: updateTimerMetric,
    });
    // Our getRecord through aggregate-ui CRUD logging has moved
    // to lds-network-adapter. We still need to respect the
    // orgs environment setting
    if (forceRecordTransactionsDisabled === false) {
        networkAdapterInstrument({
            getRecordAggregateResolve: (cb) => {
                const { recordId, apiName } = cb();
                logCRUDLightningInteraction('read', {
                    recordId,
                    recordType: apiName,
                    state: 'SUCCESS',
                });
            },
            getRecordAggregateReject: (cb) => {
                const recordId = cb();
                logCRUDLightningInteraction('read', {
                    recordId,
                    state: 'ERROR',
                });
            },
        });
    }
}

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, store: Store): void {
    ldsInstrumentationSetupInstrumentation(luvio, store);
    setAuraInstrumentationHooks();
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

export const instrumentation = new Instrumentation();
