export const ADAPTER_CACHE_HIT_COUNT_METRIC_NAME = 'cache-hit-count';
export const ADAPTER_CACHE_HIT_DURATION_METRIC_NAME = 'cache-hit-duration';
export const ADAPTER_CACHE_HIT_L2_COUNT_METRIC_NAME = 'cache-hit-l2-count';
export const ADAPTER_CACHE_HIT_L2_DURATION_METRIC_NAME = 'cache-hit-l2-duration';
export const ADAPTER_CACHE_MISS_COUNT_METRIC_NAME = 'cache-miss-count';
export const ADAPTER_CACHE_MISS_DURATION_METRIC_NAME = 'cache-miss-duration';
export const ADAPTER_CACHE_MISS_OUT_OF_TTL_COUNT_METRIC_NAME = 'cache-miss-out-of-ttl-count';
export const ADAPTER_CACHE_MISS_OUT_OF_TTL_DURATION_METRIC_NAME = 'cache-miss-out-of-ttl-duration';

/**
 * W-8121791
 * Number of subqueries used when aggregateUi is invoked for getRecord
 */
export const AGGREGATE_UI_CHUNK_COUNT = 'aggregate-ui-chunk-count';

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
export const CACHE_HIT_COUNT = ADAPTER_CACHE_HIT_COUNT_METRIC_NAME;

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
export const CACHE_MISS_COUNT = ADAPTER_CACHE_MISS_COUNT_METRIC_NAME;

/**
 * W-9949353
 * Used to track how often we dedupe HTTP requests
 * Invoked when an HTTP request is deduped against an already in-flight request
 */
export const DUPLICATE_REQUEST_COUNT = 'duplicate-request-count';

/**
 * W-7667066
 * This count represents the number of times getRecord() was invoked, but not including
 * executeAggregateUi calls.  It can be represented as the sum of the Aura Action invocations
 * GetRecordWithLayouts and GetRecordWithFields.
 */
export const GET_RECORD_NORMAL_INVOKE_COUNT = 'get-record-normal-invoke-count';

/**
 * W-7667066
 * This count represents the number of times getRecord() was invoked, with a large enough payload
 * that executeAggregateUi was used.
 */
export const GET_RECORD_AGGREGATE_INVOKE_COUNT = 'get-record-aggregate-invoke-count';

/**
 * W-7301684
 * Counter for when getRecordNotifyChange api calls are allowed through.
 */
export const GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT = 'get-record-notify-change-allow-count';

/**
 * W-7301684
 * Counter for when getRecordNotifyChange api calls are dropped/throttled.
 */
export const GET_RECORD_NOTIFY_CHANGE_DROP_COUNT = 'get-record-notify-change-drop-count';

/**
 * W-8278006
 * Counter for rate limiting telemetry. Is updated whenever the network adapter hits the specified limit.
 */
export const NETWORK_RATE_LIMIT_EXCEEDED_COUNT = 'network-rate-limit-exceeded-count';

/**
 * W-6981216
 * Timer to measure performance for LDS.storeBroadcast() method.
 */
export const STORE_BROADCAST_DURATION = 'store-broadcast-duration';

/**
 * W-6981216
 * Timer to measure performance for LDS.storeIngest() method.
 */
export const STORE_INGEST_DURATION = 'store-ingest-duration';

/**
 * W-6981216
 * Timer to measure performance for LDS.storeLookup() method.
 */
export const STORE_LOOKUP_DURATION = 'store-lookup-duration';

/**
 * W-9805009
 * Timer to measure performance for LDS.storeSetTTLOverride() method.
 */
export const STORE_SET_TTL_OVERRIDE_DURATION = 'store-set-ttl-override-duration';

/**
 * W-9805009
 * Timer to measure performance for LDS.storeSetDefaultTTLOverride() method.
 */
export const STORE_SET_DEFAULT_TTL_OVERRIDE_DURATION = 'store-set-default-ttl-override-duration';

/**
 * W-6981216
 * Counter for number of records in LDS store. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_SIZE_COUNT = 'store-size-count';

/**
 * W-6981216
 * Counter for number of LDS snapshot subscription. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT = 'store-snapshot-subscriptions-count';

/**
 * W-6981216
 * Counter for number of LDS watch subscriptions. Is updated by periodicLogger invocations.
 * Note: This is also being recorded in AILTN logging.
 */
export const STORE_WATCH_SUBSCRIPTIONS_COUNT = 'store-watch-subscriptions-count';

/**
 * W-9131128
 * Counter for graphQL get adapter response with mixed bag of both data and error in response
 */
export const GET_GRAPHQL_RESPONSE_MIXED = 'get-graphql-response-mixed-count';

/**
 * W-9537401
 * Counter for Luvio store trim task invocation
 */
export const STORE_TRIM_TASK_COUNT = 'store-trim-task-count';

/**
 * W-9537401
 * Timer to measure performance for Luvio store trim task
 */
export const STORE_TRIM_TASK_DURATION = 'store-trim-task-duration';

/**
 * W-9804037
 * Counters for Luvio cache policy usage
 * Note: Undefined cache policy defaults to different cache policies based on runtime
 */
export const CACHE_POLICY_COUNTERS = {
    'cache-and-network': 'cache-policy-cache-and-network',
    'cache-then-network': 'cache-policy-cache-then-network',
    'no-cache': 'cache-policy-no-cache',
    'only-if-cached': 'cache-policy-only-if-cached',
    'stale-while-revalidate': 'cache-policy-stale-while-revalidate',
    'valid-at': 'cache-policy-valid-at',
};
export const CACHE_POLICY_UNDEFINED_COUNTER = 'cache-policy-undefined';

export const STALE_TAG = 'stale';

/**
 * W-9804037
 * Durable Store health metric
 * Counter to track durable Store read, write and error rates
 */
export const DURABLE_STORE_COUNT = 'durable-store-count';

/**
 * W-10490363
 * GraphQL Eval health metric
 * Counter to track Success and Error Rate on Eval
 */
export const GRAPHQL_ADAPTER_COUNT = 'graphql-adapter-count';
