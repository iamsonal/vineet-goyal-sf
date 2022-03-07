import Initialize from '../lwc/initialize';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    clone,
    mockInitializeNetworkOnce,
    mockInitializeNetworkErrorOnce,
} from 'platform-admin-success-guidance-test-util';

const MOCK_PREFIX = 'wire/initialize/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('basic initialize', async () => {
        const mock = getMock('initialize');
        const config = {
            assistantTarget: mock.assistantTarget,
        };
        mockInitializeNetworkOnce(config, mock);

        const el = await setupElement(config, Initialize);
        el.invokeInitialize(config);
        await flushPromises();

        expect(clone(el.getPayload())).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {
            assistantTarget: getMock('initialize').assistantTarget,
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
        mockInitializeNetworkErrorOnce(config, mock);

        const el = await setupElement(config, Initialize);
        el.invokeInitialize(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });
});
