import {
    mockSearchRecordsNetworkOnce,
    mockSearchRecordsNetworkErrorOnce,
} from 'industries-identityverification-test-util';
import { searchRecords } from 'lds-adapters-industries-identityverification';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/searchRecords/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic searchRecords', async () => {
        const inputMock = getDataMock('SearchRecordsInput');
        const outputMock = getDataMock('SearchRecordsOutput');
        mockSearchRecordsNetworkOnce(inputMock, outputMock);

        const el = await searchRecords(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test searchRecords error case', async () => {
        const inputMock = getDataMock('SearchRecordsInput');
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
        mockSearchRecordsNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await searchRecords(inputMock);
            fail('searchRecords did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
