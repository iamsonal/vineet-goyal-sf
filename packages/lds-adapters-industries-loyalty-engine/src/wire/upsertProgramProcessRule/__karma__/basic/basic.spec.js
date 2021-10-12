import UpsertProgramProcessRule from '../lwc/upsert-program-process-rule';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    clone,
    mockUpsertProgramProcessRuleNetworkOnce,
    mockUpsertProgramProcessRuleNetworkErrorOnce,
} from 'industries-loyalty-engine-test-util';

const MOCK_PREFIX = 'wire/upsertProgramProcessRule/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test basic upsertProgramProcessRule', async () => {
        const inputMock = getMock('upsertProgramProcessRuleInput');
        const outputMock = getMock('upsertProgramProcessRuleOutput');
        const config = {
            programName: 'prog1',
            processName: 'process1',
            ruleName: 'rule1',
            programProcessRule: inputMock,
        };
        mockUpsertProgramProcessRuleNetworkOnce(config, outputMock);

        const el = await setupElement(config, UpsertProgramProcessRule);
        el.invokeUpsertProgramProcessRule(config);
        await flushPromises();
        expect(clone(el.getResult())).toEqual(outputMock);
    });

    it('displays error when network request 404s', async () => {
        const inputMock = getMock('upsertProgramProcessRuleInput');
        const config = {
            programName: 'prog1',
            processName: 'process1',
            ruleName: 'rule1',
            programProcessRule: inputMock,
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
        mockUpsertProgramProcessRuleNetworkErrorOnce(config, mock);

        const el = await setupElement(config, UpsertProgramProcessRule);
        el.invokeUpsertProgramProcessRule(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });
});
