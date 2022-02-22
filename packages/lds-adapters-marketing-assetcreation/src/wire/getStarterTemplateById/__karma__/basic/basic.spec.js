import GetStarterTemplateById from '../lwc/get-starter-template-by-id';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetStarterTemplateByIdNetworkOnce,
    mockGetStarterTemplateByIdNetworkErrorOnce,
} from 'marketing-assetcreation-test-util';

const MOCK_PREFIX = 'wire/getStarterTemplateById/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets starter template by id', async () => {
        const mock = getMock('GetStarterTemplateById');
        const config = { starterTemplateId: '100', type: 'emailtemplate' };
        mockGetStarterTemplateByIdNetworkOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplateById);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredStarterTemplateById()).toEqual(mock);
    });

    it('does not fetch the object again', async () => {
        const mock = getMock('GetStarterTemplateById');
        const config = { starterTemplateId: '100', type: 'emailtemplate' };
        mockGetStarterTemplateByIdNetworkOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplateById);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredStarterTemplateById()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetStarterTemplateById);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredStarterTemplateById()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { starterTemplateId: '100', type: 'emailtemplate' };

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
        mockGetStarterTemplateByIdNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetStarterTemplateById);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
