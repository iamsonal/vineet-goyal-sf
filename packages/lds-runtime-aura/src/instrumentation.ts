import {
    updatePercentileHistogramMetric,
    incrementCounterMetric,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    instrumentation,
} from '@salesforce/lds-instrumentation';
import {
    instrument as adaptersUiApiInstrument,
    LdsUiapiInstrumentation,
} from '@salesforce/lds-adapters-uiapi';

/*
 * Concrete implementations are only exported for code coverage
 */
export function recordConflictsResolved(serverRequestCount: number) {
    updatePercentileHistogramMetric('record-conflicts-resolved', serverRequestCount);
}
export function nullDisplayValueConflict(_entityName: string, _fieldName: string | number | null) {
    incrementCounterMetric('merge-null-dv-count');
}
export function getRecordNotifyChangeAllowed() {
    incrementGetRecordNotifyChangeAllowCount();
}
export function getRecordNotifyChangeDropped() {
    incrementGetRecordNotifyChangeDropCount();
}
export function recordApiNameChanged(incomingApiName: string, existingApiName: string) {
    instrumentation.incrementRecordApiNameChangeCount(incomingApiName, existingApiName);
}
export function weakEtagZero(
    incomingWeakEtagZero: boolean,
    existingWeakEtagZero: boolean,
    apiName: string
) {
    instrumentation.aggregateWeakETagEvents(incomingWeakEtagZero, existingWeakEtagZero, apiName);
}
export function getRecordNotifyChangeNetworkResult(
    uniqueWeakEtags: boolean | null,
    error?: boolean
) {
    instrumentation.notifyChangeNetwork(uniqueWeakEtags, error);
}
export function instrumentUiApi() {
    const uiApiInstrumentation: LdsUiapiInstrumentation = {
        recordConflictsResolved,
        nullDisplayValueConflict,
        getRecordNotifyChangeAllowed,
        getRecordNotifyChangeDropped,
        recordApiNameChanged,
        weakEtagZero,
        getRecordNotifyChangeNetworkResult,
    };
    adaptersUiApiInstrument(uiApiInstrumentation);
}
