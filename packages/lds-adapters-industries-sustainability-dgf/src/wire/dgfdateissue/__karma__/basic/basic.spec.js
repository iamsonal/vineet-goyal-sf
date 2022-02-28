import {
    mockDgfDateIssueNetworkOnce,
    mockDgfDateIssueNetworkErrorOnce,
} from 'industries-sustainability-dgf-test-util';
import { identifyDateIssues } from 'lds-adapters-industries-sustainability-dgf';
const INPUT_MOCK = {
    filters: [],
    recordId: '0pfxx000000001dAAA',
    types: ['missingDates', 'outOfDateRange', 'overlappingDates'],
};

const OUTPUT_MOCK = {
    code: 1,
    message: 'success',
    missingDatesRecords: [],
    outOfDateRangeRecords: [],
    overlappingDatesRecords: [],
};
describe('dgf date issue test', () => {
    it('test positive case of dgf date issue', async () => {
        const config = { dateIssueInput: INPUT_MOCK };
        mockDgfDateIssueNetworkOnce(config, OUTPUT_MOCK);
        const el = await identifyDateIssues(config);
        expect(el).toEqual(OUTPUT_MOCK);
    });

    it('test dgf date issue error case', async () => {
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
        const config = { dateIssueInput: INPUT_MOCK };

        mockDgfDateIssueNetworkErrorOnce(config, mockErrorResponse);
        try {
            await identifyDateIssues(config);
            fail('dgf did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
