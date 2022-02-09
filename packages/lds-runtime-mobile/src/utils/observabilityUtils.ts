import { getInstrumentation } from 'o11y/client';

export type ReporterType = ReturnType<typeof getInstrumentation>;
type Operation = () => Promise<any>;
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

/**
 * Relays errors to the instrumentation framework and tracks call counts with and without error
 *
 * @param {Object} config Counter metric with tags, metricName and async method to be instrumented
 */
export const withInstrumentation =
    (reporter: ReporterType) => (operation: Operation, config?: InstrumentationConfig) => {
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
