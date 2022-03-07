import GetStarterTemplates from '../lwc/get-starter-templates';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetStarterTemplatesNetworkOnce,
    mockGetStarterTemplatesNetworkErrorOnce,
} from 'marketing-assetcreation-test-util';

const MOCK_PREFIX = 'wire/getStarterTemplates/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets starter templates list', async () => {
        const config = { type: 'emailtemplate' };
        const mock = getMock('GetStarterTemplates');
        mockGetStarterTemplatesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredStarterTemplates()).toEqual(mock);
    });

    it('does not fetch the list again', async () => {
        const config = { type: 'emailtemplate' };
        const mock = getMock('GetStarterTemplates');
        mockGetStarterTemplatesNetworkOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredStarterTemplates()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetStarterTemplates);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredStarterTemplates()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { type: 'emailtemplate' };

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
        mockGetStarterTemplatesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
