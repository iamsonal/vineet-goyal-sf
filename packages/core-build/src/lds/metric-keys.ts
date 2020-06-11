/**
 * Note: This implementation of Metric Keys is a workaround due to @salesforce imports not currently working within LDS context.
 * To be changed in the future if that is fixed. Approved by @relango from Instrumentation team.
 */

import { MetricsKey } from 'instrumentation/service';

const METRIC_KEY_OWNER = 'lds';

/**
 * W-6981216
 * Timer to measure performance for ADSBridge.addRecords() method.
 */
export const ADS_BRIDGE_ADD_RECORDS_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-add-records-duration' };
    },
};

/**
 * W-6981216
 * Timer to measure performance for ADSBridge.emitRecordChanged() method.
 */
export const ADS_BRIDGE_EMIT_RECORD_CHANGED_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-emit-record-changed-duration' };
    },
};

/**
 * W-6981216
 * Timer to measure performance for ADSBridge.evict() method.
 */
export const ADS_BRIDGE_EVICT_DURATION: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'ads-bridge-evict-duration' };
    },
};

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
export const CACHE_HIT_COUNT: MetricsKey = {
    get() {
        return { owner: METRIC_KEY_OWNER, name: 'cache-hit-count' };
    },
};

/**
 * W-6981216
 * Counter for overall LDS cache hits.
 * Note: This is also being recorded in AILTN logging.
 */
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
