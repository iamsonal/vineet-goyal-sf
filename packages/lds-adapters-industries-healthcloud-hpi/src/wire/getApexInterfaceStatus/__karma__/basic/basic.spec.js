import GetApexInterfaceStatus from '../lwc/getApexInterfaceStatus';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetInterfaceStatusError,
    mockGetInterfaceStatusOnce,
} from 'industries-healthcloud-hpi-test-util';

const MOCK_PREFIX = 'wire/getApexInterfaceStatus/__karma__/data/';

const queryParams = {
    apexInterfaceName: 'TestapexInterfaceName',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get operation path for the getting interface implimentation presence', async () => {
        const mock = getMock('getApexInterfaceStatus');
        const config = queryParams;
        mockGetInterfaceStatusOnce(config, mock);

        const el = await setupElement(config, GetApexInterfaceStatus);
        expect(el.getWiredResponse()).toEqual(mock);
    });

    it('get operation with n/w err for the interface api', async () => {
        const config = queryParams;
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
        mockGetInterfaceStatusError(config, mock);

        const el = await setupElement(config, GetApexInterfaceStatus);

        expect(el.getError()).toEqual(mock);
    });

    it('get operation when config is a blank query for the interface api', async () => {
        const config = {};
        const mock = {
            isPresent: false,
        };

        mockGetInterfaceStatusOnce(config, mock);
        const el = await setupElement(config, GetApexInterfaceStatus);
        expect(el.getWiredResponse()).toEqual(mock);
    });
});
