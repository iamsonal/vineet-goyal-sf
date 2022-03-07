import SaveQuestionnaire from '../lwc/save-questionnaire';
import {
    getMock as globalGetMock,
    setupElement,
    assertNetworkCallCount,
    flushPromises,
} from 'test-util';
import {
    clone,
    mockSaveQuestionnaireNetworkOnce,
    mockSaveQuestionnaireNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/saveQuestionnaire/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic save questionnaire invocation: update progress', async () => {
        const mock = getMock('save-questionnaire');
        const config = {
            questionnaireName: mock.developerName,
            questionnaireData: {
                status: 'Completed',
                questionToAnswer: {},
            },
        };
        mockSaveQuestionnaireNetworkOnce(config, mock);

        const el = await setupElement(config, SaveQuestionnaire);
        el.invokeSaveQuestionnaire(config);
        await flushPromises();

        expect(clone(el.getQuestionnaire())).toEqual(mock);
    });
    it('basic save questionnaire invocation: supply answer', async () => {
        const mock = getMock('save-questionnaire');
        const config = {
            questionnaireName: mock.developerName,
            questionnaireData: {
                questionToAnswer: {
                    role: {
                        answerId: 'business_sponsor',
                        whenSeen: Date.now().toString(),
                        whenAnswered: Date.now().toString(),
                    },
                },
                status: 'Completed',
            },
        };
        mockSaveQuestionnaireNetworkOnce(config, mock);

        const el = await setupElement(config, SaveQuestionnaire);
        el.invokeSaveQuestionnaire(config);
        await flushPromises();

        expect(clone(el.getQuestionnaire())).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            questionnaireName: getMock('save-questionnaire').developerName,
            questionnaireData: {
                status: 'Completed',
                questionToAnswer: {},
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
        mockSaveQuestionnaireNetworkErrorOnce(config, mock);

        const el = await setupElement(config, SaveQuestionnaire);
        el.invokeSaveQuestionnaire(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });

    it('getQuestionnaire after saveQuestionnaire does not fetch', async () => {
        const mock = getMock('save-questionnaire');
        const config = {
            questionnaireName: mock.developerName,
            questionnaireData: {
                status: 'Completed',
                questionToAnswer: {},
            },
        };
        mockSaveQuestionnaireNetworkOnce(config, mock);
        const el = await setupElement(config, SaveQuestionnaire);

        el.invokeSaveQuestionnaire(config);
        await flushPromises();

        expect(el.getQuestionnaire()).toBeDefined();
        expect(clone(el.getQuestionnaire())).toEqual(clone(el.getQuestionnaireWire()));
        assertNetworkCallCount();
    });
});
