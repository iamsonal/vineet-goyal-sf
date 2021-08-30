/**
 * Instrumentation hooks exposed by this module.
 */
export interface AdsBridgeInstrumentation {
    /**
     * Called at the end of execution for a function to track latency
     * Current functions tracked: packages/lds-ads-bridge/src/utils/metric-keys.ts
     */
    timerMetricAddDuration?: (metricName: string, valueInMs: number) => void;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    timerMetricAddDuration: (_metricName: string, _valueInMs: number) => {},
};

/**
 * Allows external modules (typically a runtime environment) to set
 * instrumentation hooks for this module. Note that the hooks are
 * incremental - hooks not suppiled in newInstrumentation will retain
 * their previous values. The default instrumentation hooks are no-ops.
 *
 * @param newInstrumentation instrumentation hooks to be overridden
 */
export function instrument(newInstrumentation: AdsBridgeInstrumentation) {
    instrumentation = Object.assign(instrumentation, newInstrumentation);
}
