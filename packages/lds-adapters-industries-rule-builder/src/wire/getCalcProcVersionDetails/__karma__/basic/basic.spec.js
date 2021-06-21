import GetCalcProcVersionDetails from '../lwc/get-calc-proc-version-details';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetCalcProcVersionDetailsNetworkOnce,
    mockGetCalcProcVersionDetailsNetworkErrorOnce,
} from 'industries-rule-builder-test-util';

const MOCK_PREFIX = 'wire/getCalcProcVersionDetails/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic calcProcVersionDetails', async () => {
        const mock = getMock('calcProcVersionDetails');
        const config = { id: '123' };
        mockGetCalcProcVersionDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCalcProcVersionDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalcProcVersionDetails())).toEqual(mock);
    });

    it('do not fetch calcProcVersionDetails second time', async () => {
        const mock = getMock('calcProcVersionDetails');
        const config = { id: '123' };
        mockGetCalcProcVersionDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCalcProcVersionDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalcProcVersionDetails())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetCalcProcVersionDetails);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredCalcProcVersionDetails())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { id: '123' };
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
        mockGetCalcProcVersionDetailsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetCalcProcVersionDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
