/**
 * Instrumentation hooks exposed by this module.
 */
export interface AuraNetworkInstrumentation {
    getRecordAggregateInvoke?: () => void;
    getRecordAggregateRetry?: () => void;
    getRecordNormalInvoke?: () => void;
    aggregateUiChunkCount?: (chunkCount: number) => void;

    logCrud?: (operation: string, options: object) => void;

    /**
     * Called when the network rate limit is exceeded.
     */
    networkRateLimitExceeded?: () => void;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    getRecordAggregateInvoke: () => {},
    getRecordAggregateRetry: () => {},
    getRecordNormalInvoke: () => {},
    aggregateUiChunkCount: (_chunkCount: number) => {},

    logCrud: (_operation: string, _options: object) => {},

    networkRateLimitExceeded: () => {},
};

/**
 * Allows external modules (typically a runtime environment) to set
 * instrumentation hooks for this module. Note that the hooks are
 * incremental - hooks not suppiled in newInstrumentation will retain
 * their previous values. The default instrumentation hooks are no-ops.
 *
 * @param newInstrumentation instrumentation hooks to be overridden
 */
export function instrument(newInstrumentation: AuraNetworkInstrumentation) {
    instrumentation = Object.assign(instrumentation, newInstrumentation);
}
