import { Adapter } from '@luvio/engine';
import { AdapterMetadata } from './ldsAdapter';
import { refreshApiNames } from './bindWireRefresh';

/**
 * Instrumentation hooks exposed by this module.
 */
export interface LwcBindingsInstrumentation {
    /**
     * Called when an LWC calls `refresh`.
     */
    refreshCalled?: (fromSource: keyof refreshApiNames) => void;

    /**
     * Called when creating wire adapters.
     */
    instrumentAdapter?: <C, D>(adapter: Adapter<C, D>, metadata: AdapterMetadata) => Adapter<C, D>;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    refreshCalled: (_fromSource: keyof refreshApiNames) => {},
    instrumentAdapter: <C, D>(
        adapter: Adapter<C, D>,
        _metadata: AdapterMetadata
    ): Adapter<C, D> => {
        return adapter;
    },
};

/**
 * Allows external modules (typically a runtime environment) to set
 * instrumentation hooks for this module. Note that the hooks are
 * incremental - hooks not suppiled in newInstrumentation will retain
 * their previous values. The default instrumentation hooks are no-ops.
 *
 * @param newInstrumentation instrumentation hooks to be overridden
 */
export function instrument(newInstrumentation: LwcBindingsInstrumentation) {
    instrumentation = Object.assign(instrumentation, newInstrumentation);
}
