import SaveAssistant from '../lwc/save-assistant';
import {
    getMock as globalGetMock,
    setupElement,
    assertNetworkCallCount,
    flushPromises,
} from 'test-util';
import {
    clone,
    mockSaveAssistantNetworkOnce,
    mockSaveAssistantNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/saveAssistant/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic save assistant invocation: progress', async () => {
        const mock = getMock('save-assistant');
        const config = {
            assistantName: mock.developerName,
            assistantData: {
                items: {
                    learn_about_salesforce: {
                        status: 'Completed',
                    },
                },
            },
        };
        mockSaveAssistantNetworkOnce(config, mock);

        const el = await setupElement(config, SaveAssistant);
        el.invokeSaveAssistant(config);
        await flushPromises();

        expect(clone(el.getAssistant())).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            assistantName: getMock('save-assistant').developerName,
            assistantData: {
                items: {
                    learn_about_salesforce: {
                        status: 'Completed',
                    },
                },
            },
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
        mockSaveAssistantNetworkErrorOnce(config, mock);

        const el = await setupElement(config, SaveAssistant);
        el.invokeSaveAssistant(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });

    it('getAssistant after saveAssistant does not fetch', async () => {
        const mock = getMock('save-assistant');
        const config = {
            assistantName: mock.developerName,
            assistantData: {
                items: {
                    learn_about_salesforce: {
                        status: 'Completed',
                    },
                },
            },
        };
        mockSaveAssistantNetworkOnce(config, mock);
        const el = await setupElement(config, SaveAssistant);

        el.invokeSaveAssistant(config);
        await flushPromises();

        expect(el.getAssistant()).toBeDefined();
        expect(clone(el.getAssistant())).toEqual(clone(el.getAssistantWire()));
        assertNetworkCallCount();
    });
});
