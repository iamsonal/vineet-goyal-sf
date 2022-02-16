import {
    mockDgfDateIssueNetworkOnce,
    mockDgfDateIssueNetworkErrorOnce,
} from 'industries-sustainability-dgf-test-util';
import { fetchDateIssues } from 'lds-adapters-industries-sustainability-dgf';
const INPUT_MOCK = {
    recordId: '0pfxx0000000001AAA',
    types: ['type1'],

    filters: [{}],
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
        mockDgfDateIssueNetworkOnce(INPUT_MOCK, OUTPUT_MOCK);
        const el = await fetchDateIssues(INPUT_MOCK);
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
        mockDgfDateIssueNetworkErrorOnce(INPUT_MOCK, mockErrorResponse);
        try {
            await fetchDateIssues(INPUT_MOCK);
            fail('dgf did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
