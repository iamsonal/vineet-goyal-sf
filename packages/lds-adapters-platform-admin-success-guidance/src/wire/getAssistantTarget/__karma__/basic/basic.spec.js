import GetAssistantTarget from '../lwc/get-assistant-target';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetAssistantTargetNetworkOnce,
    mockGetAssistantTargetNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getAssistantTarget/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic assistant target', async () => {
        const mock = getMock('assistant-target');
        const config = {
            assistantTarget: mock.developerName,
        };
        mockGetAssistantTargetNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistantTarget);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantTarget())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('assistant-target');
        const config = {
            assistantTarget: mock.developerName,
        };
        mockGetAssistantTargetNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistantTarget);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantTarget())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetAssistantTarget);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantTarget())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            assistantTarget: getMock('assistant-target').developerName,
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
        mockGetAssistantTargetNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetAssistantTarget);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
