import {
    mockPostExplainabilityActionLogNetworkOnce,
    mockPostExplainabilityActionLogNetworkErrorOnce,
} from 'industries-explainability-test-util';
import { postExplainabilityActionLog } from 'lds-adapters-industries-explainability';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/postExplainabilityActionLog/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/postExplainabilityActionLog/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic postExplainabilityActionLog', async () => {
        const outputMock = getOutputMock('explainabilityActionLogOutput');
        const inputMock = getInputMock('explainabilityActionLogInput');
        mockPostExplainabilityActionLogNetworkOnce(inputMock, outputMock);

        const el = await postExplainabilityActionLog(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test postExplainabilityActionLog error case', async () => {
        const inputMock = getInputMock('explainabilityActionLogInput');
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
        mockPostExplainabilityActionLogNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await postExplainabilityActionLog(inputMock);
            fail('postExplainabilityActionLog did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
