import { getInstrumentation } from 'o11y/client';

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

export const METRIC_NAME = {
    /**
     * W-9804037 Track durable Store error rate
     */
    DURABLE_STORE: 'durable-store',
};

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
