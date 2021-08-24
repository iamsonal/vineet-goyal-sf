/**
 * Instrumentation hooks exposed by this module.
 */
export interface LdsUiapiInstrumentation {
    /**
     * Called when a set of record conflicts has been fully resolved. The
     * parameter indicates the number of server requests that were needed
     * to fully resolve all the record conflicts.
     */
    recordConflictsResolved?: (serverRequestCount: number) => void;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    recordConflictsResolved: (_serverRequestCount: number) => {},
};

/**
 * Allows external modules (typically a runtime environment) to set
 * instrumentation hooks for this module. Note that the hooks are
 * incremental - hooks not suppiled in newInstrumentation will retain
 * their previous values. The default instrumentation hooks are no-ops.
 *
 * @param newInstrumentation instrumentation hooks to be overridden
 */
export function instrument(newInstrumentation: LdsUiapiInstrumentation) {
    instrumentation = Object.assign(instrumentation, newInstrumentation);
}
