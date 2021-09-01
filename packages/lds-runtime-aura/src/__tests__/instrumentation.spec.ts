import {
    getRecordNotifyChangeAllowed,
    getRecordNotifyChangeDropped,
    getRecordNotifyChangeNetworkResult,
    nullDisplayValueConflict,
    recordApiNameChanged,
    recordConflictsResolved,
    weakEtagZero,
} from '../instrumentation';

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        aggregateWeakETagEvents: jest.fn(),
        incrementRecordApiNameChangeCount: jest.fn(),
        notifyChangeNetwork: jest.fn(),
    };
    return {
        instrumentation: {
            aggregateWeakETagEvents: spies.aggregateWeakETagEvents,
            incrementRecordApiNameChangeCount: spies.incrementRecordApiNameChangeCount,
            notifyChangeNetwork: spies.notifyChangeNetwork,
        },
        incrementGetRecordNotifyChangeDropCount: jest.fn(),
        incrementGetRecordNotifyChangeAllowCount: jest.fn(),
        incrementCounterMetric: jest.fn(),
        updatePercentileHistogramMetric: jest.fn(),
        __spies: spies,
    };
});
import {
    incrementCounterMetric,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    updatePercentileHistogramMetric,
    __spies as instrumentationSpies,
} from '@salesforce/lds-instrumentation';

describe('Hooks', () => {
    it('calls the correct instrumentation methods', () => {
        getRecordNotifyChangeNetworkResult(true);
        recordApiNameChanged('foo', 'bar');
        weakEtagZero(true, true, 'foobar');
        expect(instrumentationSpies.notifyChangeNetwork).toHaveBeenCalled();
        expect(instrumentationSpies.incrementRecordApiNameChangeCount).toHaveBeenCalled();
        expect(instrumentationSpies.aggregateWeakETagEvents).toHaveBeenCalled();
    });
    it('calls the getRecordNotifyChange hooks', () => {
        getRecordNotifyChangeAllowed();
        getRecordNotifyChangeDropped();
        expect(incrementGetRecordNotifyChangeAllowCount).toHaveBeenCalled();
        expect(incrementGetRecordNotifyChangeDropCount).toHaveBeenCalled();
    });
    it('calls the getRecord merge hooks', () => {
        nullDisplayValueConflict('entityFoo', 'fieldBar');
        recordConflictsResolved(5);
        expect(updatePercentileHistogramMetric).toHaveBeenCalled();
        expect(incrementCounterMetric).toHaveBeenCalled();
    });
});
