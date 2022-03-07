import {
    mockPostServicePlanTemplateDetailsNetwokOnce,
    mockPostServicePlanTemplateDetailsNetwokErrorOnce,
} from 'industries-public-sector-test-util';
import { postServicePlanTemplateDetails } from 'lds-adapters-industries-public-sector';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/postServicePlanTemplateDetails/__karma__/data/';
const MOCK_OUTPUT_PREFIX = 'wire/postServicePlanTemplateDetails/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

function getOutputMock(filename) {
    return globalGetMock(MOCK_OUTPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test postServicePlanTemplateDetails with benefits input only', async () => {
        const outputMock = getOutputMock('postServicePlanTemplateDetailsOutput');
        const inputMock = getInputMock('benefitsOnlyInput');
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
            actionType: 'associate',
            servicePlanTemplateRecord: inputMock,
        };
        mockPostServicePlanTemplateDetailsNetwokOnce(config, outputMock);

        const el = await postServicePlanTemplateDetails(config);
        expect(el).toEqual(outputMock);
    });

    it('test postServicePlanTemplateDetails with goals input only', async () => {
        const outputMock = getOutputMock('postServicePlanTemplateDetailsOutput');
        const inputMock = getInputMock('goalsOnlyInput');
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
            actionType: 'associate',
            servicePlanTemplateRecord: inputMock,
        };
        mockPostServicePlanTemplateDetailsNetwokOnce(config, outputMock);

        const el = await postServicePlanTemplateDetails(config);
        expect(el).toEqual(outputMock);
    });

    it('test postServicePlanTemplateDetails with both goals and benefits input', async () => {
        const outputMock = getOutputMock('postServicePlanTemplateDetailsOutput');
        const inputMock = getInputMock('benefitsAndGoalsInput');
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
            actionType: 'associate',
            servicePlanTemplateRecord: inputMock,
        };
        mockPostServicePlanTemplateDetailsNetwokOnce(config, outputMock);

        const el = await postServicePlanTemplateDetails(config);
        expect(el).toEqual(outputMock);
    });

    it('test postServicePlanTemplateDetails with both goals and benefits input with empty input objects', async () => {
        const outputMock = getOutputMock('postServicePlanTemplateDetailsOutput');
        const inputMock = getInputMock('benefitsAndGoalsInputWithEmptyObjs');
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
            actionType: 'associate',
            servicePlanTemplateRecord: inputMock,
        };
        mockPostServicePlanTemplateDetailsNetwokOnce(config, outputMock);

        const el = await postServicePlanTemplateDetails(config);
        expect(el).toEqual(outputMock);
    });

    it('test postServicePlanTemplateDetails error case', async () => {
        const inputMock = getInputMock('benefitsAndGoalsInput');
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
            actionType: 'associate',
            servicePlanTemplateRecord: inputMock,
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
        mockPostServicePlanTemplateDetailsNetwokErrorOnce(config, mockErrorResponse);
        try {
            await postServicePlanTemplateDetails(config);
            fail('postServicePlanTemplateDetails did not throw when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
