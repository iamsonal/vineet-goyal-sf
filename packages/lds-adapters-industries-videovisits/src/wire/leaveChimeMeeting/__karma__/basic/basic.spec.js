import {
    mockLeaveChimeMeetingNetworkOnce,
    mockLeaveChimeMeetingNetworkErrorOnce,
} from 'industries-videovisits-test-util';
import { leaveChimeMeeting } from 'lds-adapters-industries-videovisits';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/leaveChimeMeeting/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic leaveChimeMeeting', async () => {
        const inputMock = getDataMock('LeaveChimeMeetingInput');
        const outputMock = getDataMock('LeaveChimeMeetingOutput');
        mockLeaveChimeMeetingNetworkOnce(inputMock, outputMock);

        const el = await leaveChimeMeeting(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test leaveChimeMeeting error case', async () => {
        const inputMock = getDataMock('LeaveChimeMeetingInput');
        const mockErrorResponse = {
            status: 404,
            statusText: 'NOT_FOUND',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockLeaveChimeMeetingNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await leaveChimeMeeting(inputMock);
            fail('leaveChimeMeeting did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
