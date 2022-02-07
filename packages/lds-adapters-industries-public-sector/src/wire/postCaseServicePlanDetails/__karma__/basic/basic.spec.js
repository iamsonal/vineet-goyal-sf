import {
    mockPostCaseServicePlanDetailsNetwokOnce,
    mockPostCaseServicePlanDetailsNetwokErrorOnce,
} from 'industries-public-sector-test-util';
import { postCaseServicePlanDetails } from 'lds-adapters-industries-public-sector';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/postCaseServicePlanDetails/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/postCaseServicePlanDetails/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test postCaseServicePlanDetails creation', async () => {
        const outputMock = getOutputMock('CaseServicePlanDetailsOutput');
        const inputMock = getInputMock('CaseServicePlanDetailsInput');
        const config = {
            caseServicePlan: inputMock,
        };
        mockPostCaseServicePlanDetailsNetwokOnce(config, outputMock);

        const el = await postCaseServicePlanDetails(config);
        expect(el).toEqual(outputMock);
    });

    it('test postCaseServicePlanDetails error case', async () => {
        const inputMock = getInputMock('CaseServicePlanDetailsInput');
        const config = {
            caseServicePlan: inputMock,
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
        mockPostCaseServicePlanDetailsNetwokErrorOnce(config, mockErrorResponse);
        try {
            await postCaseServicePlanDetails(config);
            fail('postCaseServicePlanDetails did not throw when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
