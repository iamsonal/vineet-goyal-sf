import SaveColumns from '../lwc/save-columns';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    clone,
    mockSaveColumnsNetworkOnce,
    mockSaveColumnsNetworkErrorOnce,
} from 'industries-decision-matrix-designer-test-util';

const MOCK_PREFIX = 'wire/saveColumns/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('save columns invocation: progress', async () => {
        const mock = getMock('save-columns');
        const data = getMock('save-columns-request');
        const config = {
            matrixId: '0lIxx0000000001EAA',
            columns: data,
        };
        mockSaveColumnsNetworkOnce(config, mock);

        const el = await setupElement(config, SaveColumns);
        el.invokeSaveColumns(config);
        await flushPromises();
        expect(clone(el.getResult())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const data = getMock('save-columns-request');
        const config = {
            matrixId: '0lIxx0000000001EAA',
            columns: data,
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
        mockSaveColumnsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, SaveColumns);
        el.invokeSaveColumns(config);
        await flushPromises();

        expect(clone(el.getError())).toEqual(mock);
    });
});
