import GetAssistantList from '../../../getAssistantList/__karma__/lwc/get-assistant-list';
import { saveAssistantList } from 'lds-adapters-platform-admin-success-guidance';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSaveAssistantListNetworkOnce,
    mockSaveAssistantListNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/saveAssistantList/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic save assistant list invocation', async () => {
        const mock = getMock('save-assistant-list');
        const config = {
            assistantTarget: mock.assistantTarget,
            assistantData: {
                assistantList: {
                    sfdc_internal_test_started: {
                        isArchived: true,
                    },
                    sfdc_internal_test_started2: {
                        isArchived: false,
                    },
                },
            },
        };
        mockSaveAssistantListNetworkOnce(config, mock);

        const response = await saveAssistantList(config);

        expect(response).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            assistantTarget: getMock('save-assistant-list').assistantTarget,
            assistantData: {
                assistantList: {
                    sfdc_internal_test_started: {
                        isArchived: true,
                    },
                    sfdc_internal_test_started2: {
                        isArchived: false,
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
        mockSaveAssistantListNetworkErrorOnce(config, mock);

        try {
            await saveAssistantList(config);
            // make sure we are hitting the catch
            fail('saveAssistantList did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });

    it('getAssistantList after saveAssistantList does not fetch', async () => {
        const mock = getMock('save-assistant-list');
        const config = {
            assistantTarget: mock.assistantTarget,
            assistantData: {
                assistantList: {
                    sfdc_internal_test_started: {
                        isArchived: true,
                    },
                    sfdc_internal_test_started2: {
                        isArchived: false,
                    },
                },
            },
        };
        mockSaveAssistantListNetworkOnce(config, mock);

        await saveAssistantList(config);

        const element = await setupElement(config, GetAssistantList);
        expect(element.pushCount()).toBe(1);
        expect(clone(element.getWiredAssistantList())).toEqual(mock);
    });
});
