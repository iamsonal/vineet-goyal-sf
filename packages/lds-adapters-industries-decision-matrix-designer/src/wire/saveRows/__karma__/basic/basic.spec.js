import SaveRows from '../lwc/save-rows';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    clone,
    mockSaveRowsNetworkOnce,
    mockSaveRowsNetworkErrorOnce,
} from 'industries-decision-matrix-designer-test-util';

const MOCK_PREFIX = 'wire/saveRows/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('save rows invocation: progress', async () => {
        const mock = getMock('save-rows-response');
        const data = getMock('save-rows-request');
        const config = {
            versionId: '0lIxx0000000001EAG',
            matrixId: '0lIxx0000000001EAA',
            rowsInput: data,
        };
        mockSaveRowsNetworkOnce(config, mock);

        const el = await setupElement(config, SaveRows);
        el.invokeSaveRows(config);
        await flushPromises();
        expect(clone(el.getResult())).toEqual(mock);
    });

    it('save rows invocation: from file', async () => {
        const mock = getMock('save-rows-response');
        const data = { fileId: '0lIxx0000000001EAZ' };
        const config = {
            versionId: '0lIxx0000000001EAG',
            matrixId: '0lIxx0000000001EAA',
            rowsInput: data,
        };
        mockSaveRowsNetworkOnce(config, mock);

        const el = await setupElement(config, SaveRows);
        el.invokeSaveRows(config);
        await flushPromises();
        expect(clone(el.getResult())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const data = getMock('save-rows-request');
        const config = {
            matrixId: '0lIxx0000000001EAA',
            versionId: '0lIxx0000000001EAA',
            rowsInput: data,
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
        mockSaveRowsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, SaveRows);
        el.invokeSaveRows(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });
});
