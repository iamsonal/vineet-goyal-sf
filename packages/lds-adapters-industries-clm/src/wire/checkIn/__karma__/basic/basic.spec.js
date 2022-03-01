import { getMock as globalGetMock } from 'test-util';
import { mockCheckInNetworkOnce, mockCheckIntNetworkErrorOnce } from 'industries-clm-test-util';
import { checkIn } from 'lds-adapters-industries-clm';

const MOCK_PREFIX = 'wire/checkIn/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('checkIn templates details', async () => {
        const config = { contractdocumentversionid: '1' };
        const outputMock = getMock('outputMock');
        const inputMock = getMock('inputMock');

        mockCheckInNetworkOnce(config, outputMock);
        const el = await checkIn(inputMock);
        expect(el).toEqual(outputMock);
    });
    it('displays error when network request 404s', async () => {
        const config = { contractdocumentversionid: '1' };
        const inputMock = getMock('inputMock');
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
        mockCheckIntNetworkErrorOnce(config, mock);

        try {
            await checkIn(inputMock);
            fail('Error');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });
});
