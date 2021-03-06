import GetColumns from '../lwc/get-columns';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetColumnsNetworkOnce,
    mockGetColumnsNetworkErrorOnce,
} from 'industries-decision-matrix-designer-test-util';

const MOCK_PREFIX = 'wire/getColumns/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic matrix columns', async () => {
        const config = { matrixId: '0lIxx0000000001EAA' };
        const mock = getMock('get-columns-response');
        mockGetColumnsNetworkOnce(config, mock);

        const el = await setupElement(config, GetColumns);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getData())).toEqual(mock);
    });

    it('gets basic matrix columns: empty response', async () => {
        const config = { matrixId: '0lIxx0000000001EAA' };
        const mock = getMock('get-columns-response');
        mock.columns = [];
        mockGetColumnsNetworkOnce(config, mock);

        const el = await setupElement(config, GetColumns);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getData())).toEqual(mock);
    });

    it('do not fetch columns second time', async () => {
        const config = { matrixId: '0lIxx0000000001EAA' };
        const mock = getMock('get-columns-response');
        mockGetColumnsNetworkOnce(config, mock);

        const el = await setupElement(config, GetColumns);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getData())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetColumns);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getData())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { matrixId: '0lIxx0000000001EAA' };
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
        mockGetColumnsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetColumns);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
