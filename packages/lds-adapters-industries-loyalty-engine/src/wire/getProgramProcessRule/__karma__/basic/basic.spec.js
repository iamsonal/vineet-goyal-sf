import GetProgramProcessRule from '../lwc/get-program-process-rule';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetProgramProcessRuleNetworkOnce,
    mockGetProgramProcessRuleNetworkErrorOnce,
} from 'industries-loyalty-engine-test-util';

const MOCK_PREFIX = 'wire/getProgramProcessRule/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets rule details', async () => {
        const mock = getMock('processRuleDetailRepresentation');
        const config = {
            programName: 'prog1',
            processName: 'process1',
            ruleName: 'rule1',
        };
        mockGetProgramProcessRuleNetworkOnce(config, mock);

        const element = await setupElement(config, GetProgramProcessRule);
        expect(clone(element.getWiredRuleDetail())).toEqual(mock);
    });

    it('do not fetch rule details second time', async () => {
        const mock = getMock('processRuleDetailRepresentation');
        const config = {
            programName: 'prog1',
            processName: 'process1',
            ruleName: 'rule1',
        };
        mockGetProgramProcessRuleNetworkOnce(config, mock);

        const el = await setupElement(config, GetProgramProcessRule);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRuleDetail())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetProgramProcessRule);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredRuleDetail())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            programName: 'prog1',
            processName: 'process1',
            ruleName: 'rule1',
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
        mockGetProgramProcessRuleNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetProgramProcessRule);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
