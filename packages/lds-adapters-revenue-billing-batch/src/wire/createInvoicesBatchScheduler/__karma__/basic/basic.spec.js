import {
    mockCreateInvoicesBatchScheduler,
    mockCreateInvoicesBatchSchedulerErrorOnce,
} from '../../../../../karma/revenue-billing-batch-test-util';
import { createInvoicesBatchScheduler } from 'lds-adapters-revenue-billing-batch';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createInvoicesBatchScheduler/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test create invoices batch scheduler happy path with all input fields', async () => {
        const mock = getMock('createInvoicesBatchSchedulerResponse');
        const testInput = getMock('createInvoicesBatchSchedulerInputWithAllFields');
        mockCreateInvoicesBatchScheduler(testInput, mock);

        const el = await createInvoicesBatchScheduler(testInput);
        expect(el).toEqual(mock);
    });

    it('test create invoices batch scheduler without filter criteria', async () => {
        const mock = getMock('createInvoicesBatchSchedulerResponseWithoutFilters');
        const testInput = getMock('createInvoicesBatchSchedulerInputWithoutFilters');
        mockCreateInvoicesBatchScheduler(testInput, mock);

        const el = await createInvoicesBatchScheduler(testInput);
        expect(el).toEqual(mock);
    });

    it('test create invoices batch scheduler error case', async () => {
        const testInput = getMock('createInvoicesBatchSchedulerInputWithAllFields');
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
        mockCreateInvoicesBatchSchedulerErrorOnce(testInput, mockErrorResponse);
        try {
            await createInvoicesBatchScheduler(testInput);
            fail('createInvoicesBatchScheduler did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
