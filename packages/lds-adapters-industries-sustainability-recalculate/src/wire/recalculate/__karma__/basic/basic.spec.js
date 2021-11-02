import { recalculate } from 'lds-adapters-industries-sustainability-recalculate';
import { getMock as globalGetMock } from 'test-util';
import {
    mockRecalculateNetworkOnce,
    mockRecalculateNetworkErrorOnce,
} from 'industries-sustainability-recalculate-test-util';

const MOCK_INPUT_PREFIX = 'wire/recalculate/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('recalculate test', () => {
    it('test positive case of recalculate', async () => {
        const outputMock = getInputMock('recalculateOutput');
        const inputMock = getInputMock('recalculateInput');
        mockRecalculateNetworkOnce(inputMock, outputMock);

        const el = await recalculate(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test recalculate error case', async () => {
        const inputMock = getInputMock('recalculateInput');
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
        mockRecalculateNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await recalculate(inputMock);
            fail('recalculate did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
