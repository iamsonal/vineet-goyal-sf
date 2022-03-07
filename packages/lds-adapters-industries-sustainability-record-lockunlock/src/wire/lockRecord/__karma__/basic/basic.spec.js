import {
    mockLockRecordNetworkOnce,
    mockLockRecordNetworkErrorOnce,
} from 'industries-sustainability-record-lockunlock-test-util';
import { lockRecord } from 'lds-adapters-industries-sustainability-record-lockunlock';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/lockRecord/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('lockRecord test', () => {
    it('test positive case of lockRecord', async () => {
        const outputMock = getInputMock('lockRecordOutput');
        const inputMock = getInputMock('lockRecordInput');
        mockLockRecordNetworkOnce(inputMock, outputMock);

        const el = await lockRecord(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test lockRecord error case', async () => {
        const inputMock = getInputMock('lockRecordInput');
        const mockErrorResponse = {
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
        mockLockRecordNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await lockRecord(inputMock);
            fail('lockRecord did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
