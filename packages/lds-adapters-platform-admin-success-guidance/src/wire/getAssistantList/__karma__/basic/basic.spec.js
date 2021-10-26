import GetAssistantList from '../lwc/get-assistant-list';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetAssistantListNetworkOnce,
    mockGetAssistantListNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getAssistantList/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic assistant list', async () => {
        const mock = getMock('assistant-list');
        const config = {
            assistantTarget: mock.assistantTarget,
        };
        mockGetAssistantListNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistantList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantList())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('assistant-list');
        const config = {
            assistantTarget: mock.assistantTarget,
        };
        mockGetAssistantListNetworkOnce(config, mock);

        const el = await setupElement(config, GetAssistantList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantList())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetAssistantList);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el.getWiredAssistantList())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            assistantTarget: getMock('assistant-list').assistantTarget,
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
        mockGetAssistantListNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetAssistantList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
