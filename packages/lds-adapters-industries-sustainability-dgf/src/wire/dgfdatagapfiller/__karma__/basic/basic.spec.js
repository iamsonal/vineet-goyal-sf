import {
    mockDgfDataGapFillerNetworkOnce,
    mockDgfDataGapFillerNetworkErrorOnce,
} from 'industries-sustainability-dgf-test-util';
import { getDataGapFillers } from 'lds-adapters-industries-sustainability-dgf';

const INPUT_MOCK = {
    recordId: '0pfxx0000000001AAA',
    methods: ['method1'],
    filters: [{}],
};
const OUTPUT_MOCK = {
    code: 1,
    message: 'success',
    gaps: [],
};
describe('dgf data gap filler  test', () => {
    it('test positive case of dgf data gap filler', async () => {
        mockDgfDataGapFillerNetworkOnce(INPUT_MOCK, OUTPUT_MOCK);
        const el = await getDataGapFillers(INPUT_MOCK);
        expect(el).toEqual(OUTPUT_MOCK);
    });

    it('test dgf data gap filler error case', async () => {
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
        mockDgfDataGapFillerNetworkErrorOnce(INPUT_MOCK, mockErrorResponse);
        try {
            await getDataGapFillers(INPUT_MOCK);
            fail('dgf did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
