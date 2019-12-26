import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordUi from '../lwc/record-ui';

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('record-ui error responses', () => {
    it('should emit error when server returns error', async () => {
        const mockError = getMock('single-record-invalid-layouttype-modes-View');
        const config = {
            recordIds: 'a07B0000002MTICIA4', // record id doesn't matter
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, { reject: true, data: mockError });

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredError()).toContainErrorResponse(mockError);
    });
});
