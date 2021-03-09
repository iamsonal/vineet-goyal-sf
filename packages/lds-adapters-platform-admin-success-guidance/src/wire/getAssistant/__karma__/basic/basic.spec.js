import GetAssistant from '../lwc/get-assistant';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetAssistantNetworkOnce,
    mockGetAssistantNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getAssistant/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic assistant', async () => {
        const mock = getMock('assistant');
        const config = {
            assistantGroup: 'test_assistant_group_id',
            scenarioId: 'test_scenario_id',
        };
        mockGetAssistantNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistant);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistant())).toEqual(mock);
    });

    it('does not fetch assistant a second time', async () => {
        const mock = getMock('assistant');
        const config = {
            assistantGroup: 'test_assistant_group_id',
            scenarioId: 'test_scenario_id',
        };
        mockGetAssistantNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistant);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistant())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetAssistant);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredAssistant())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            assistantGroup: 'test_assistant_group_id',
            scenarioId: 'test_scenario_id',
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
        mockGetAssistantNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetAssistant);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
