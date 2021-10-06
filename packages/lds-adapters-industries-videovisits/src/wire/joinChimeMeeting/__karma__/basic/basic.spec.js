import {
    mockJoinChimeMeetingNetworkOnce,
    mockJoinChimeMeetingNetworkErrorOnce,
} from 'industries-videovisits-test-util';
import { chimeMeeting } from 'lds-adapters-industries-videovisits';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/joinChimeMeeting/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic joinChimeMeeting', async () => {
        const inputMock = getDataMock('JoinChimeMeetingInput');
        const outputMock = getDataMock('JoinChimeMeetingOutput');
        mockJoinChimeMeetingNetworkOnce(inputMock, outputMock);

        const el = await chimeMeeting(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test joinChimeMeeting error case', async () => {
        const inputMock = getDataMock('JoinChimeMeetingInput');
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
        mockJoinChimeMeetingNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await chimeMeeting(inputMock);
            fail('chimeMeeting did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
