import { setAuraInstrumentationHooks } from '../main';
import * as adaptersUiApi from '@salesforce/lds-adapters-uiapi';
import * as ldsInstrumentation from '@salesforce/lds-instrumentation';

let adaptersUiApiInstrument;
let incrementCounterMetric;

beforeEach(() => {
    adaptersUiApiInstrument = jest.spyOn(adaptersUiApi, 'instrument');
    incrementCounterMetric = jest.spyOn(ldsInstrumentation, 'incrementCounterMetric');
});

afterEach(() => {
    adaptersUiApiInstrument.mockClear();
    incrementCounterMetric.mockClear();
});

describe('adaptersUiApiInstrument', () => {
    describe('nullDisplayValueConflict', () => {
        it('scalar type field metrics', () => {
            setAuraInstrumentationHooks();

            const { nullDisplayValueConflict } = adaptersUiApiInstrument.mock.calls[0][0];
            nullDisplayValueConflict({
                entityName: 'entityName',
                fieldName: 'fieldName',
                fieldType: 'scalar',
                areValuesEqual: false,
            });

            expect(incrementCounterMetric).toHaveBeenCalledWith('merge-null-dv-count.scalar.false');
        });

        it('spanning record type field metrics', () => {
            setAuraInstrumentationHooks();

            const { nullDisplayValueConflict } = adaptersUiApiInstrument.mock.calls[0][0];
            nullDisplayValueConflict({
                entityName: 'entityName',
                fieldName: 'fieldName',
                fieldType: 'spanning-record',
                areValuesEqual: undefined,
            });

            expect(incrementCounterMetric).toHaveBeenCalledWith(
                'merge-null-dv-count.spanning-record'
            );
        });
    });
});
