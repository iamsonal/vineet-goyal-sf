import GetScenarios from '../../../getScenarios/__karma__/lwc/get-scenarios';
import { updateScenarios } from 'lds-adapters-platform-admin-success-guidance';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockUpdateScenariosNetworkOnce,
    mockUpdateScenariosNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/updateScenarios/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic update scenarios invocation', async () => {
        const mock = getMock('update-scenarios');
        const config = {
            assistantGroup: 'sfdc_internal_test',
            scenarioData: {
                scenarios: {
                    sfdc_internal_test_started: {
                        isArchived: true,
                    },
                    sfdc_internal_test_started2: {
                        isArchived: false,
                    },
                },
            },
        };
        mockUpdateScenariosNetworkOnce(config, mock);

        const response = await updateScenarios(config);

        expect(response).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            assistantGroup: 'sfdc_internal_test',
            scenarioData: {
                scenarios: {
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
        mockUpdateScenariosNetworkErrorOnce(config, mock);

        try {
            await updateScenarios(config);
            // make sure we are hitting the catch
            fail('updateScenarios did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });

    it('getScenarios after updateScenarios does not fetch', async () => {
        const mock = getMock('update-scenarios');
        const config = {
            assistantGroup: 'sfdc_internal_test',
            scenarioData: {
                scenarios: {
                    sfdc_internal_test_started: {
                        isArchived: true,
                    },
                    sfdc_internal_test_started2: {
                        isArchived: false,
                    },
                },
            },
        };
        mockUpdateScenariosNetworkOnce(config, mock);

        await updateScenarios(config);

        const element = await setupElement(config, GetScenarios);
        expect(element.pushCount()).toBe(1);
        expect(clone(element.getWiredScenarios())).toEqual(mock);
    });
});
