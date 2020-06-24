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
