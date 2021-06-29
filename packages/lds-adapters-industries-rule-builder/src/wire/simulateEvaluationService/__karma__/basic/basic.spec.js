import {
    mockSimulateEvaluationServiceNetworkOnce,
    mockSimulateEvaluationServiceNetworkErrorOnce,
} from 'industries-rule-builder-test-util';
import { simulateEvaluationService } from 'lds-adapters-industries-rule-builder';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/simulateEvaluationService/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/simulateEvaluationService/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic simulateEvaluationService', async () => {
        const outputMock = getOutputMock('simulationResult');
        const inputMock = getInputMock('simulationInput');
        const config = {
            id: 'testId',
            simulationInput: inputMock,
        };
        mockSimulateEvaluationServiceNetworkOnce(config, outputMock);

        const el = await simulateEvaluationService(config);
        expect(el).toEqualWithExtraNestedData(outputMock);
    });

    it('test basic simulateEvaluationService when no internal error occured', async () => {
        const outputMock = getOutputMock('simulationResultWithoutErrorField');
        const inputMock = getInputMock('simulationInput');
        const config = {
            id: 'testId',
            simulationInput: inputMock,
        };
        mockSimulateEvaluationServiceNetworkOnce(config, outputMock);

        const el = await simulateEvaluationService(config);
        expect(el).toEqualWithExtraNestedData(outputMock);
    });

    it('test basic simulateEvaluationService when internal error occured', async () => {
        const outputMock = getOutputMock('simulationResultWithInternalError');
        const inputMock = getInputMock('simulationInput');
        const config = {
            id: 'testId',
            simulationInput: inputMock,
        };
        mockSimulateEvaluationServiceNetworkOnce(config, outputMock);

        const el = await simulateEvaluationService(config);
        expect(el).toEqualWithExtraNestedData(outputMock);
    });

    it('test simulateEvaluationService network error 404', async () => {
        const inputMock = getInputMock('simulationInput');
        const config = {
            id: 'testId',
            simulationInput: inputMock,
        };
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
        mockSimulateEvaluationServiceNetworkErrorOnce(config, mockErrorResponse);
        try {
            await simulateEvaluationService(config);
            fail('simulateEvaluationService did not throw an error when expected to');
        } catch (e) {
            expect(e).toContainErrorResponse(mockErrorResponse);
        }
    });
});
