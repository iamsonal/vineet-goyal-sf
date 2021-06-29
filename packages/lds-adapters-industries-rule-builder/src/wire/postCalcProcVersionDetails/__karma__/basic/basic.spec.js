import {
    mockPostCalcProcVersionDetailsNetworkOnce,
    mockPostCalcProcVersionDetailsNetworkErrorOnce,
} from 'industries-rule-builder-test-util';
import { postCalcProcVersionDetails } from 'lds-adapters-industries-rule-builder';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/postCalcProcVersionDetails/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/getCalcProcVersionDetails/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic postCalcProcVersionDetails', async () => {
        const outputMock = getOutputMock('calcProcVersionDetails');
        const inputMock = getInputMock('calcProcVersionDetailsInput');
        mockPostCalcProcVersionDetailsNetworkOnce(inputMock, outputMock);

        const el = await postCalcProcVersionDetails(inputMock);
        expect(el).toEqualWithExtraNestedData(outputMock);
    });

    it('test basic postCalcProcVersionDetails with required inputs only', async () => {
        const outputMock = getOutputMock('calcProcVersionDetails');
        const inputMock = getInputMock('calcProcVersionDetailsInputWithMandatoryFieldsOnly');
        mockPostCalcProcVersionDetailsNetworkOnce(inputMock, outputMock);

        const el = await postCalcProcVersionDetails(inputMock);
        expect(el).toEqualWithExtraNestedData(outputMock);
    });

    it('test postCalcProcVersionDetails error case', async () => {
        const inputMock = getInputMock('calcProcVersionDetailsInput');
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
        mockPostCalcProcVersionDetailsNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await postCalcProcVersionDetails(inputMock);
            fail('postCalcProcVersionDetails did not throw an error when expected to');
        } catch (e) {
            expect(e).toContainErrorResponse(mockErrorResponse);
        }
    });
});
