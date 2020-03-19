import { MetricsKey } from 'instrumentation/service';

const METRIC_KEY_OWNER = 'lds';
/**
 * Note: This implementation of Metric Keys is a workaround due to @salesforce imports not currently working within LDS context.
 * To be changed in the future if that is fixed. Approved by @relango from Instrumentation team.
 */
export const ADS_BRIDGE_ADD_RECORDS_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-add-records-duration' };
    },
};

export const ADS_BRIDGE_EMIT_RECORD_CHANGED_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-emit-record-changed-duration' };
    },
};

export const ADS_BRIDGE_EVICT_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-evict-duration' };
    },
};

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
