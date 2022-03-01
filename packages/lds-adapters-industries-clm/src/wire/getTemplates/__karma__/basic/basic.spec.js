import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetTemplatesNetworkOnce,
    mockGetTemplatestNetworkErrorOnce,
    clone,
} from 'industries-clm-test-util';
//GetTemplates
const MOCK_PREFIX = 'wire/getTemplates/__karma__/data/';
import GetTemplates from '../lwc/getTemplates';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets templates details', async () => {
        const config = { objecttype: 'Contract' };

        const outputMock = getMock('templates');
        mockGetTemplatesNetworkOnce(config, outputMock);
        const el = await setupElement(config, GetTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContractDetails()).toEqual(outputMock);
    });
    it('displays error when network request 404s', async () => {
        const config = { objecttype: 'Contract' };
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
        mockGetTemplatestNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
    it('do not fetch templates second time', async () => {
        const config = { objecttype: 'Contract' };
        const outputMock = getMock('templates');

        mockGetTemplatesNetworkOnce(config, outputMock);
        const el = await setupElement(config, GetTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContractDetails()).toEqual(outputMock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetTemplates);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredContractDetails())).toEqual(outputMock);
    });
});
