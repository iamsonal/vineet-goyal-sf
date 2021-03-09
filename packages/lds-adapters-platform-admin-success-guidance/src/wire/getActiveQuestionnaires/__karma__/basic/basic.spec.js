import GetActiveQuestionnaires from '../lwc/get-active-questionnaires';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetActiveQuestionnairesNetworkOnce,
    mockGetActiveQuestionnairesNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getActiveQuestionnaires/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic active questionnaire list', async () => {
        const mock = getMock('active-questionnaires');
        const config = { assistantGroup: 'assistantGroupName', scenarioId: 'scenarioName' };
        mockGetActiveQuestionnairesNetworkOnce(config, mock);

        const el = await setupElement(config, GetActiveQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredActiveQuestionnaires())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('active-questionnaires');
        const config = { assistantGroup: 'assistantGroupName', scenarioId: 'scenarioName' };
        mockGetActiveQuestionnairesNetworkOnce(config, mock);

        const el = await setupElement(config, GetActiveQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredActiveQuestionnaires())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetActiveQuestionnaires);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el.getWiredActiveQuestionnaires())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { assistantGroup: 'assistantGroupName', scenarioId: 'scenarioName' };
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
        mockGetActiveQuestionnairesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetActiveQuestionnaires);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
