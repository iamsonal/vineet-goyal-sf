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

    /**
     * Called during merging of incoming and existing FieldValues.
     * Called when the incoming FieldValue display value is null.
     *
     * Note: Temporary instrumentation to capture distribution and frequency, W-8990630
     * Flipped to counter metric due to W-9611107
     */
    nullDisplayValueConflict?: (entityName: string, fieldName: string | number | null) => void;

    /**
     * SFDC Throttling
     */
    getRecordNotifyChangeAllowed?: () => void;
    getRecordNotifyChangeDropped?: () => void;

    /**
     * RecordRepresentation merge
     * Called when records change apiName
     */
    recordApiNameChanged?: (incomingApiName: string, existingApiName: string) => void;

    /**
     * RecordRepresentation merge
     * Called when either incoming or existing RecordRepresentation has a weakEtag=0
     */
    weakEtagZero?: (
        incomingWeakEtagZero: boolean,
        existingWeakEtagZero: boolean,
        apiName: string
    ) => void;

    /**
     * getRecord notifyChangeFactory
     * Called when dispatchResourceRequest is resolved/rejected
     */
    getRecordNotifyChangeNetworkResult?: (uniqueWeakEtags: boolean | null, error?: boolean) => void;
}

// For use by callers within this module to instrument interesting things.
export let instrumentation = {
    recordConflictsResolved: (_serverRequestCount: number) => {},
    nullDisplayValueConflict: (_entityName: string, _fieldName: string | number | null) => {},
    getRecordNotifyChangeAllowed: () => {},
    getRecordNotifyChangeDropped: () => {},
    recordApiNameChanged: (_existingApiName: string, _incomingApiName: string) => {},
    weakEtagZero: (
        _incomingWeakEtagZero: boolean,
        _existingWeakEtagZero: boolean,
        _apiName: string
    ) => {},
    getRecordNotifyChangeNetworkResult: (_uniqueWeakEtags: boolean | null, _error?: boolean) => {},
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
