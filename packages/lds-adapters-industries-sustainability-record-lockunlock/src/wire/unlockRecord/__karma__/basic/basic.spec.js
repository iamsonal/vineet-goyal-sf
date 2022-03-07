import {
    mockUnlockRecordNetworkOnce,
    mockUnlockRecordNetworkErrorOnce,
} from 'industries-sustainability-record-lockunlock-test-util';
import { unlockRecord } from 'lds-adapters-industries-sustainability-record-lockunlock';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/unlockRecord/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('unlockRecord test', () => {
    it('test positive case of unlockRecord', async () => {
        const outputMock = getInputMock('unlockRecordOutput');
        const inputMock = getInputMock('unlockRecordInput');
        mockUnlockRecordNetworkOnce(inputMock, outputMock);

        const el = await unlockRecord(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test unlockRecord error case', async () => {
        const inputMock = getInputMock('unlockRecordInput');
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
        mockUnlockRecordNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await unlockRecord(inputMock);
            fail('unlockRecord did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
