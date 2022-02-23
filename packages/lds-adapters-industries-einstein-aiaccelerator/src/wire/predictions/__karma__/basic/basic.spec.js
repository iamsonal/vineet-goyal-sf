import {
    mockPredictionsNetworkOnce,
    mockPredictionsNetworkErrorOnce,
    mockPredictionsExtractedRecordOverridesNetworkOnce,
} from 'industries-einstein-aiaccelerator-test-util';
import { predictions } from 'lds-adapters-industries-einstein-aiaccelerator';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/predictions/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('predictions basic', () => {
    it('test basic predictions success case', async () => {
        const inputMock = getDataMock('PredictionInput');
        const outputMock = getDataMock('PredictionOutput');
        mockPredictionsNetworkOnce(inputMock, outputMock);

        const el = await predictions(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test Extracted Record Overrides predictions success case', async () => {
        const inputMock = getDataMock('PredictionInputExtractedRecordOverrides');
        const outputMock = getDataMock('PredictionOutputExtractedRecordOverrides');
        mockPredictionsExtractedRecordOverridesNetworkOnce(inputMock, outputMock);

        const el = await predictions(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test  basic predictions error case', async () => {
        const inputMock = getDataMock('PredictionInput');
        const mockErrorResponse = {
            status: 404,
            statusText: 'NOT_FOUND',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockPredictionsNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await predictions(inputMock);
            fail('predictions did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
