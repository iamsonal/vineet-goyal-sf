import { MetricsKey } from 'instrumentation/service';
import { NORMALIZED_APEX_ADAPTER_NAME } from './main';

export const ADAPTER_CACHE_HIT_COUNT_METRIC_NAME = 'cache-hit-count';
export const ADAPTER_CACHE_HIT_DURATION_METRIC_NAME = 'cache-hit-duration';
export const ADAPTER_CACHE_MISS_COUNT_METRIC_NAME = 'cache-miss-count';
export const ADAPTER_CACHE_MISS_DURATION_METRIC_NAME = 'cache-miss-duration';
export const ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME = 'cache-miss-out-of-ttl-count';
export const ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME = 'cache-miss-out-of-ttl-duration';
const METRIC_KEY_OWNER = 'lds';

/**
 * Note: This implementation of Metric Keys is a workaround due to @salesforce imports not currently working within LDS context.
 * To be changed in the future if that is fixed. Approved by @relango from Instrumentation team.
 */

/**
 * W-8121791
 * Number of subqueries used when aggregateUi is invoked for getRecord
 */
export const AGGREGATE_UI_CHUNK_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'aggregate-ui-chunk-count' };
    },
};

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
export const CACHE_HIT_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: ADAPTER_CACHE_HIT_COUNT_METRIC_NAME };
    },
};

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
export const CACHE_MISS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: ADAPTER_CACHE_MISS_COUNT_METRIC_NAME };
    },
};

/**
 * W-8379680
 * Counter for number of getApex requests.
 */
export const GET_APEX_CACHE_HIT_COUNT: MetricsKey = {
    get() {
        return {
            owner: METRIC_KEY_OWNER,
            name: ADAPTER_CACHE_HIT_COUNT_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-8379680
 * Counter for number of getApex errors.
 */
export const GET_APEX_CACHE_HIT_DURATION: MetricsKey = {
    get() {
        return {
            owner: METRIC_KEY_OWNER,
            name: ADAPTER_CACHE_HIT_DURATION_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-8379680
 * Counter for number of getApex cache misses.
 */
export const GET_APEX_CACHE_MISS_COUNT: MetricsKey = {
    get() {
        return {
            owner: METRIC_KEY_OWNER,
            name: ADAPTER_CACHE_MISS_COUNT_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-8379680
 * Timer for duration of getApex cache misses.
 */
export const GET_APEX_CACHE_MISS_DURATION: MetricsKey = {
    get() {
        return {
            owner: METRIC_KEY_OWNER,
            name: ADAPTER_CACHE_MISS_DURATION_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-7667066
 * This count represents the number of times getRecord() was invoked, but not including
 * executeAggregateUi calls.  It can be represented as the sum of the Aura Action invocations
 * GetRecordWithLayouts and GetRecordWithFields.
 */
export const GET_RECORD_NORMAL_INVOKE_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-normal-invoke-count' };
    },
};

/**
 * W-7667066
 * This count represents the number of times getRecord() was invoked, with a large enough payload
 * that executeAggregateUi was used.
 */
export const GET_RECORD_AGGREGATE_INVOKE_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-aggregate-invoke-count' };
    },
};

/**
 * W-7301684
 * Counter for when getRecordNotifyChange api calls are allowed through.
 */
export const GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-notify-change-allow-count' };
    },
};

/**
 * W-7301684
 * Counter for when getRecordNotifyChange api calls are dropped/throttled.
 */
export const GET_RECORD_NOTIFY_CHANGE_DROP_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-notify-change-drop-count' };
    },
};

/**
 * W-8278006
 * Counter for rate limiting telemetry. Is updated whenever the network adapter hits the specified limit.
 */
export const NETWORK_RATE_LIMIT_EXCEEDED_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'network-rate-limit-exceeded-count' };
    },
};

/**
 * W-6981216
 * Timer to measure performance for LDS.storeBroadcast() method.
 */
export const STORE_BROADCAST_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-broadcast-duration' };
    },
};

/**
 * W-6981216
 * Timer to measure performance for LDS.storeIngest() method.
 */
export const STORE_INGEST_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-ingest-duration' };
    },
};

/**
 * W-6981216
 * Timer to measure performance for LDS.storeLookup() method.
 */
export const STORE_LOOKUP_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-lookup-duration' };
    },
};

/**
 * W-6981216
 * Counter for number of records in LDS store. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_SIZE_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-size-count' };
    },
};

/**
 * W-6981216
 * Counter for number of LDS snapshot subscription. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-snapshot-subscriptions-count' };
    },
};

/**
 * W-6981216
 * Counter for number of LDS watch subscriptions. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_WATCH_SUBSCRIPTIONS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-watch-subscriptions-count' };
    },
};

/**
 * W-9131128
 * Counter for graphQL get adapter response with mixed bag of both data and error in response
 */
export const GET_GRAPHQL_RESPONSE_MIXED: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-graphql-response-mixed-count' };
    },
};

/**
 * W-9537401
 * Counter for Luvio store trim task invocation
 */
export const STORE_TRIM_TASK_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-trim-task-count' };
    },
};

/**
 * W-9537401
 * Timer to measure performance for Luvio store trim task
 */
export const STORE_TRIM_TASK_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-trim-task-duration' };
    },
};
