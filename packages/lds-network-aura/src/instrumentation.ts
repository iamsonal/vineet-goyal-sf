import type { FetchResponse } from '@luvio/engine';

/**
 * Instrumentation hooks exposed by this module.
 */
export interface AuraNetworkInstrumentation {
    /**
     * Called after completion of a CRUD event.
     * Used for Event Monitoring.
     */
    logCrud(operation: string, options: object): void;
    /**
     * Called at the start of a network request
     */
    networkRequest(): void;
    /**
     * Called with the response from the network
     * @param cb callback to retrieve the FetchResponse
     */
    networkResponse(cb: () => FetchResponse<unknown>): void;
}

const NO_OP = () => {};
// For use by callers within this module to instrument interesting things.
export const instrumentation: AuraNetworkInstrumentation = {
    logCrud: NO_OP,
    networkRequest: NO_OP,
    networkResponse: NO_OP,
};

/**
 * Allows external modules (typically a runtime environment) to set
 * instrumentation hooks for this module. Note that the hooks are
 * incremental - hooks not suppiled in newInstrumentation will retain
 * their previous values. The default instrumentation hooks are no-ops.
 *
 * @param newInstrumentation instrumentation hooks to be overridden
 */
export function instrument(newInstrumentation: Partial<AuraNetworkInstrumentation>) {
    Object.assign(instrumentation, newInstrumentation);
}
