import {
    mockDgfDataGapFillerNetworkOnce,
    mockDgfDataGapFillerNetworkErrorOnce,
} from 'industries-sustainability-dgf-test-util';
import { computeDataGapFillers } from 'lds-adapters-industries-sustainability-dgf';

const INPUT_MOCK = {
    recordId: '0pfxx0000000001AAA',
    methods: ['method1'],
    filters: [{ item: 'some_item', value: 'some_value' }],
};
const OUTPUT_MOCK = {
    code: 1,
    message: 'success',
    gaps: [],
};
describe('dgf data gap filler  test', () => {
    it('test positive case of dgf data gap filler', async () => {
        const config = { dataGapInput: INPUT_MOCK };
        mockDgfDataGapFillerNetworkOnce(config, OUTPUT_MOCK);
        const el = await computeDataGapFillers(config);
        expect(el).toEqual(OUTPUT_MOCK);
    });

    it('test dgf data gap filler error case', async () => {
        const config = { dataGapInput: INPUT_MOCK };

        const mockErrorResponse = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockDgfDataGapFillerNetworkErrorOnce(config, mockErrorResponse);
        try {
            await computeDataGapFillers(config);
            fail('dgf did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
