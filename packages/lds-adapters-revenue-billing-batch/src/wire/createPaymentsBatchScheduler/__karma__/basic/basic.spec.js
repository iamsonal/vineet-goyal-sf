import {
    mockCreatePaymentsBatchScheduler,
    mockCreatePaymentsBatchSchedulerErrorOnce,
} from '../../../../../karma/revenue-billing-batch-test-util';
import { createPaymentsBatchScheduler } from 'lds-adapters-revenue-billing-batch';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createPaymentsBatchScheduler/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test create payments batch scheduler happy path with all input fields', async () => {
        const mock = getMock('createPaymentsBatchSchedulerResponse');
        const testInput = getMock('createPaymentsBatchSchedulerInputWithAllFields');
        mockCreatePaymentsBatchScheduler(testInput, mock);

        const el = await createPaymentsBatchScheduler(testInput);
        expect(el).toEqual(mock);
    });

    it('test create payments batch scheduler without filter criteria', async () => {
        const mock = getMock('createPaymentsBatchSchedulerResponseWithoutFilters');
        const testInput = getMock('createPaymentsBatchSchedulerInputWithoutFilters');
        mockCreatePaymentsBatchScheduler(testInput, mock);

        const el = await createPaymentsBatchScheduler(testInput);
        expect(el).toEqual(mock);
    });

    it('test create payments batch scheduler error case', async () => {
        const testInput = getMock('createPaymentsBatchSchedulerInputWithAllFields');
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
        mockCreatePaymentsBatchSchedulerErrorOnce(testInput, mockErrorResponse);
        try {
            await createPaymentsBatchScheduler(testInput);
            fail('createPaymentsBatchScheduler did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
