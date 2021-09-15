import {
    updatePercentileHistogramMetric,
    incrementCounterMetric,
    incrementGetRecordAggregateInvokeCount,
    incrementGetRecordAggregateRetryCount,
    incrementGetRecordNormalInvokeCount,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    incrementNetworkRateLimitExceededCount,
    instrumentation as ldsInstrumentation,
    logCRUDLightningInteraction,
    setAggregateUiChunkCountMetric,
    updateTimerMetric,
} from '@salesforce/lds-instrumentation';
import { instrument as adaptersUiApiInstrument } from '@salesforce/lds-adapters-uiapi';
import { instrument as networkAuraInstrument } from '@salesforce/lds-network-aura';
import { instrument as lwcBindingsInstrument } from '@salesforce/lds-bindings';
import { instrument as adsBridgeInstrument } from '@salesforce/lds-ads-bridge';

/**
 * One call does it all
 */
export function setInstrumentationHooks() {
    adaptersUiApiInstrument({
        recordConflictsResolved: (serverRequestCount: number) =>
            updatePercentileHistogramMetric('record-conflicts-resolved', serverRequestCount),
        nullDisplayValueConflict: () => incrementCounterMetric('merge-null-dv-count'),
        getRecordNotifyChangeAllowed: incrementGetRecordNotifyChangeAllowCount,
        getRecordNotifyChangeDropped: incrementGetRecordNotifyChangeDropCount,
        recordApiNameChanged:
            ldsInstrumentation.incrementRecordApiNameChangeCount.bind(ldsInstrumentation),
        weakEtagZero: ldsInstrumentation.aggregateWeakETagEvents.bind(ldsInstrumentation),
        getRecordNotifyChangeNetworkResult:
            ldsInstrumentation.notifyChangeNetwork.bind(ldsInstrumentation),
    });
    networkAuraInstrument({
        getRecordAggregateInvoke: incrementGetRecordAggregateInvokeCount,
        getRecordAggregateRetry: incrementGetRecordAggregateRetryCount,
        getRecordNormalInvoke: incrementGetRecordNormalInvokeCount,
        aggregateUiChunkCount: setAggregateUiChunkCountMetric,
        logCrud: logCRUDLightningInteraction,
        networkRateLimitExceeded: incrementNetworkRateLimitExceededCount,
    });
    lwcBindingsInstrument({
        refreshCalled: ldsInstrumentation.handleRefreshApiCall.bind(ldsInstrumentation),
        instrumentAdapter: ldsInstrumentation.instrumentAdapter.bind(ldsInstrumentation),
    });
    adsBridgeInstrument({
        timerMetricAddDuration: updateTimerMetric,
    });
}
