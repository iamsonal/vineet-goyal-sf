import {
    mockStoreExplainabilityActionLogNetworkOnce,
    mockStoreExplainabilityActionLogNetworkErrorOnce,
} from 'industries-explainability-test-util';
import { storeExplainabilityActionLog } from 'lds-adapters-industries-explainability';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/storeExplainabilityActionLog/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/storeExplainabilityActionLog/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic storeExplainabilityActionLog', async () => {
        const outputMock = getOutputMock('explainabilityActionLogOutput');
        const inputMock = getInputMock('explainabilityActionLogInput');
        mockStoreExplainabilityActionLogNetworkOnce(inputMock, outputMock);

        const el = await storeExplainabilityActionLog(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test storeExplainabilityActionLog error case', async () => {
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
        mockStoreExplainabilityActionLogNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await storeExplainabilityActionLog(inputMock);
            fail('storeExplainabilityActionLog did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });

    it('test basic storeExplainabilityActionLog with only required params', async () => {
        const outputMock = getOutputMock('explainabilityActionLogOutput');
        const inputMock = getInputMock('explainabilityActionLogInputRequiredParams');
        mockStoreExplainabilityActionLogNetworkOnce(inputMock, outputMock);

        const el = await storeExplainabilityActionLog(inputMock);
        expect(el).toEqual(outputMock);
    });
});
