import GetDealParties from '../lwc/get-deal-parties';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDealPartiesNetworkOnce,
    mockGetDealPartiesNetworkErrorOnce,
} from 'industries-cib-test-util';

const MOCK_PREFIX = 'wire/getDealParties/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic DealParties', async () => {
        const mock = getMock('deal-parties');
        const config = {
            financialDealId: '0lsR00000000014IAA',
            partyRoles: ['Partner'],
        };
        mockGetDealPartiesNetworkOnce(config, mock);

        const el = await setupElement(config, GetDealParties);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredDealParties()).toEqual(mock);
    });

    it('do not fetch DealParties second time', async () => {
        const mock = getMock('deal-parties');
        const config = {
            financialDealId: '0lsR00000000014IAA',
            partyRoles: ['Partner'],
        };
        mockGetDealPartiesNetworkOnce(config, mock);

        const el = await setupElement(config, GetDealParties);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredDealParties()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetDealParties);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredDealParties()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            financialDealId: '0lsR00000000014IAA',
            partyRoles: ['Partner'],
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
        mockGetDealPartiesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDealParties);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
