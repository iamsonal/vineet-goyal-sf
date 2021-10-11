/**
 * Observability / Critical Availability Program (230+)
 *
 * This file is intended to be used as a consolidated place for all definitions, functions,
 * and helpers related to "M1"[1].
 *
 * Below are the R.E.A.D.S. metrics for the Lightning Data Service, defined here[2].
 *
 * [1] https://salesforce.quip.com/NfW9AsbGEaTY
 * [2] https://salesforce.quip.com/1dFvAba1b0eq
 */

import { MetricsKey } from 'instrumentation/service';
import { NORMALIZED_APEX_ADAPTER_NAME } from '../main';

export const OBSERVABILITY_NAMESPACE = 'LIGHTNING.lds.service';
export const ADAPTER_INVOCATION_COUNT_METRIC_NAME = 'request';
export const ADAPTER_ERROR_COUNT_METRIC_NAME = 'error';

/**
 * W-8379680
 * Counter for number of getApex requests.
 */
export const GET_APEX_REQUEST_COUNT: MetricsKey = {
    get() {
        return {
            owner: OBSERVABILITY_NAMESPACE,
            name: ADAPTER_INVOCATION_COUNT_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-8379680
 * Counter for number of getApex errors.
 */
export const GET_APEX_ERROR_COUNT: MetricsKey = {
    get() {
        return {
            owner: OBSERVABILITY_NAMESPACE,
            name: ADAPTER_ERROR_COUNT_METRIC_NAME + '.' + NORMALIZED_APEX_ADAPTER_NAME,
        };
    },
};

/**
 * W-8828410
 * Counter for the number of UnfulfilledSnapshotErrors the luvio engine has.
 */
export const TOTAL_ADAPTER_ERROR_COUNT: MetricsKey = {
    get() {
        return { owner: OBSERVABILITY_NAMESPACE, name: ADAPTER_ERROR_COUNT_METRIC_NAME };
    },
};

/**
 * W-8828410
 * Counter for the number of invocations made into LDS by a wire adapter.
 */
export const TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT: MetricsKey = {
    get() {
        return { owner: OBSERVABILITY_NAMESPACE, name: ADAPTER_INVOCATION_COUNT_METRIC_NAME };
    },
};
