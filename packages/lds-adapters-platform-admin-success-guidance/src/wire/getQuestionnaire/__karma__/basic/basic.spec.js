import getQuestionnaire from '../lwc/get-questionnaire';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetQuestionnaireNetworkOnce,
    mockGetQuestionnaireNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getQuestionnaire/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic active questionnaire list', async () => {
        const mock = getMock('getQuestionnaire');
        const config = {
            assistantGroup: 'test_assistant_group_id',
            questionnaireId: 'test_questionnaire',
        };
        mockGetQuestionnaireNetworkOnce(config, mock);

        const el = await setupElement(config, getQuestionnaire);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredQuestionnaire())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('getQuestionnaire');
        const config = {
            assistantGroup: 'test_assistant_group_id',
            questionnaireId: 'test_questionnaire',
        };
        mockGetQuestionnaireNetworkOnce(config, mock);

        const el = await setupElement(config, getQuestionnaire);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredQuestionnaire())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, getQuestionnaire);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredQuestionnaire())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            assistantGroup: 'test_assistant_group_id',
            questionnaireId: 'test_questionnaire',
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
        mockGetQuestionnaireNetworkErrorOnce(config, mock);

        const el = await setupElement(config, getQuestionnaire);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
