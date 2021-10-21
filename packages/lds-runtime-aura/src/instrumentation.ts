import {
    updatePercentileHistogramMetric,
    incrementCounterMetric,
    incrementGetRecordAggregateInvokeCount,
    incrementGetRecordAggregateRetryCount,
    incrementGetRecordNormalInvokeCount,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    incrementNetworkRateLimitExceededCount,
    setAggregateUiChunkCountMetric,
} from '@salesforce/lds-instrumentation';
import {
    logCRUDLightningInteraction,
    updateTimerMetric,
    instrumentation as auraInstrumentation,
} from './aura-instrumentation/main';
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
            auraInstrumentation.incrementRecordApiNameChangeCount.bind(auraInstrumentation),
        weakEtagZero: auraInstrumentation.aggregateWeakETagEvents.bind(auraInstrumentation),
        getRecordNotifyChangeNetworkResult:
            auraInstrumentation.notifyChangeNetwork.bind(auraInstrumentation),
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
        refreshCalled: auraInstrumentation.handleRefreshApiCall.bind(auraInstrumentation),
        instrumentAdapter: auraInstrumentation.instrumentAdapter.bind(auraInstrumentation),
    });
    adsBridgeInstrument({
        timerMetricAddDuration: updateTimerMetric,
    });
}
