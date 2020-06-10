import { MetricsKey } from 'instrumentation/service';

const METRIC_KEY_OWNER = 'lds';
/**
 * Note: This implementation of Metric Keys is a workaround due to @salesforce imports not currently working within LDS context.
 * To be changed in the future if that is fixed. Approved by @relango from Instrumentation team.
 */
export const CACHE_HIT_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'cache-hit-count' };
    },
};

export const CACHE_MISS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'cache-miss-count' };
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

export const GET_RECORD_NOTIFY_CHANGE_ALLOW_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-notify-change-allow-count' };
    },
};

export const GET_RECORD_NOTIFY_CHANGE_DROP_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'get-record-notify-change-drop-count' };
    },
};

export const STORE_BROADCAST_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-broadcast-duration' };
    },
};

export const STORE_INGEST_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-ingest-duration' };
    },
};

export const STORE_LOOKUP_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-lookup-duration' };
    },
};

export const STORE_SIZE_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-size-count' };
    },
};

export const STORE_SNAPSHOT_SUBSCRIPTIONS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-snapshot-subscriptions-count' };
    },
};

export const STORE_WATCH_SUBSCRIPTIONS_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'store-watch-subscriptions-count' };
    },
};
