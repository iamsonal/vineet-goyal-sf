/**
 * Instrumentation hooks exposed by this module.
 */
export interface AuraNetworkInstrumentation {
    logCrud?: (operation: string, options: object) => void;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    logCrud: (_operation: string, _options: object) => {},
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
