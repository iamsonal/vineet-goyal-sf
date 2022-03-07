import type { getInstrumentation } from 'o11y/client';

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

export const OBSERVABILITY_NAMESPACE = 'LIGHTNING.lds.service';
export const ADAPTER_INVOCATION_COUNT_METRIC_NAME = 'request';
export const ADAPTER_ERROR_COUNT_METRIC_NAME = 'error';

/**
 * W-8828410
 * Counter for the number of UnfulfilledSnapshotErrors the luvio engine has.
 */
export const TOTAL_ADAPTER_ERROR_COUNT = ADAPTER_ERROR_COUNT_METRIC_NAME;

/**
 * W-8828410
 * Counter for the number of invocations made into LDS by a wire adapter.
 */
export const TOTAL_ADAPTER_REQUEST_SUCCESS_COUNT = ADAPTER_INVOCATION_COUNT_METRIC_NAME;

// TODO [W-10660352]: Remove after o11y/client package exposes the Instrumentation type
export type ReporterType = ReturnType<typeof getInstrumentation>;

type Operation = () => Promise<any>;

export type WithInstrumentation = (
    operation: () => Promise<any>,
    config: InstrumentationConfig
) => Promise<any>;

export interface InstrumentationConfig {
    tags: Record<string, string>;
    metricName: string;
}

export const O11Y_NAMESPACE_LDS_MOBILE = 'lds-mobile';

/**
 * Higher order function that instruments any async operation
 *
 * @param {Object} reporter Instrumentation reporter
 */
export const withInstrumentation =
    (reporter: ReporterType) =>
    /**
     * Relays errors to the instrumentation framework and tracks call counts with and without error
     *
     * @param {Function} operation Async method that needs to be instrumented
     * @param {Object} config Metric name and Tags that needs be sent during reporting
     * @returns
     */
    (operation: Operation, config?: InstrumentationConfig): Promise<any> => {
        if (reporter === undefined || config === undefined) {
            // No instrumentation is needed for the method. Return as is.
            return operation();
        }

        const { tags, metricName } = config;

        let hasError = false;

        return operation()
            .catch((err: Error) => {
                hasError = true;
                reporter.error(err);

                throw err;
            })
            .finally(() => {
                reporter.incrementCounter(metricName, 1, hasError, tags);
            });
    };
