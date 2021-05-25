import GetScenarios from '../lwc/get-scenarios';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetScenariosNetworkOnce,
    mockGetScenariosNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/getScenarios/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic scenario list', async () => {
        const mock = getMock('scenarios');
        const config = { assistantGroup: 'assistantGroupName' };
        mockGetScenariosNetworkOnce(config, mock);

        const el = await setupElement(config, GetScenarios);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredScenarios())).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('scenarios');
        const config = { assistantGroup: 'assistantGroupName' };
        mockGetScenariosNetworkOnce(config, mock);

        const el = await setupElement(config, GetScenarios);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredScenarios())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetScenarios);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el.getWiredScenarios())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { assistantGroup: 'assistantGroupName' };
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
        mockGetScenariosNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetScenarios);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
