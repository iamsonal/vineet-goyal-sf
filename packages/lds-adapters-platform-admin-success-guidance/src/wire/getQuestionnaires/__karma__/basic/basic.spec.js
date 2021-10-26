import GetQuestionnaires from '../lwc/get-questionnaires';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetQuestionnairesNetworkOnce,
    mockGetQuestionnairesNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getQuestionnaires/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic questionnaire list', async () => {
        const mock = getMock('questionnaires');
        const config = {
            assistantName: mock.assistantName,
        };
        mockGetQuestionnairesNetworkOnce(config, mock);

        const el = await setupElement(config, GetQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredQuestionnaires())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('questionnaires');
        const config = {
            assistantName: mock.assistantName,
        };
        mockGetQuestionnairesNetworkOnce(config, mock);

        const el = await setupElement(config, GetQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredQuestionnaires())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetQuestionnaires);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el.getWiredQuestionnaires())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            assistantName: getMock('questionnaires').assistantName,
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
        mockGetQuestionnairesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
