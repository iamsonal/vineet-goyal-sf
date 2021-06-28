import GetCalcProcDetails from '../lwc/get-calc-proc-details';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetCalcProcDetailsNetworkOnce,
    mockGetCalcProcDetailsNetworkErrorOnce,
} from 'industries-rule-builder-test-util';

const MOCK_PREFIX = 'wire/getCalcProcDetails/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic calcProcDetails', async () => {
        const mock = getMock('calcProcDetails');
        const config = { id: '123' };
        mockGetCalcProcDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCalcProcDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalcProcDetails())).toEqual(mock);
    });

    it('do not fetch calcProcDetails second time', async () => {
        const mock = getMock('calcProcDetails');
        const config = { id: '123' };
        mockGetCalcProcDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetCalcProcDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalcProcDetails())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetCalcProcDetails);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredCalcProcDetails())).toEqual(mock);
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
        mockGetCalcProcDetailsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetCalcProcDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
