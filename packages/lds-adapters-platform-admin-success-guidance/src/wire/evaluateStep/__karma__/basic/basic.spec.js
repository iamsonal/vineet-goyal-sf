import EvaluateStep from '../lwc/evaluate-step';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    clone,
    mockEvaluateStepNetworkOnce,
    mockEvaluateStepNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/evaluateStep/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic evaluate step', async () => {
        const mock = getMock('evaluate-step');
        const config = {
            assistantTarget: 'test_assistant_target_id',
            stepId: 'test_step_id',
        };
        mockEvaluateStepNetworkOnce(config, mock);

        const el = await setupElement(config, EvaluateStep);
        el.invokeEvaluateStep(config);
        await flushPromises();

        expect(clone(el.getStepData())).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            assistantTarget: 'test_assistant_target_id',
            stepId: 'test_step_id',
        };
        const mock = {
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
        mockEvaluateStepNetworkErrorOnce(config, mock);

        const el = await setupElement(config, EvaluateStep);
        el.invokeEvaluateStep(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });
});
