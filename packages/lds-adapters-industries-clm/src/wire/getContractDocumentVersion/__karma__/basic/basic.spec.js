import GetContractDetail from '../lwc/getcontract';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetContractNetworkOnce,
    mockGetContractNetworkErrorOnce,
    clone,
} from 'industries-clm-test-util';

const MOCK_PREFIX = 'wire/getContractDocumentVersion/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets contract details', async () => {
        const config = { contractId: '800xx000000bnkHAAQ' };
        const mock = getMock('contractDocumentVersion');
        mockGetContractNetworkOnce(config, mock);
        const el = await setupElement(config, GetContractDetail);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContractDetails()).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = { contractId: '800xx000000bnkHAAQ' };
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
        mockGetContractNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetContractDetail);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
    it('do not fetch contract second time', async () => {
        const config = { contractId: '800xx000000bnkHAAQ' };
        const mock = getMock('contractDocumentVersion');
        mockGetContractNetworkOnce(config, mock);

        const el = await setupElement(config, GetContractDetail);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContractDetails()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetContractDetail);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredContractDetails())).toEqual(mock);
    });
});
