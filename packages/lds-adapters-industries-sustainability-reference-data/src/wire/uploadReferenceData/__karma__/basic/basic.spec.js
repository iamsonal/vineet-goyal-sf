import {
    mockUploadReferenceDataNetworkOnce,
    mockUploadReferenceDataNetworkErrorOnce,
} from 'industries-sustainability-reference-data-test-util';
import { uploadReferenceData } from 'lds-adapters-industries-sustainability-reference-data';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/uploadReferenceData/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('uploadReferenceData test', () => {
    it('test positive case of uploadReferenceData', async () => {
        const outputMock = getInputMock('uploadReferenceDataOutput');
        const inputMock = getInputMock('uploadReferenceDataInput');
        mockUploadReferenceDataNetworkOnce(inputMock, outputMock);

        const el = await uploadReferenceData(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test uploadReferenceData error case', async () => {
        const inputMock = getInputMock('uploadReferenceDataInput');
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
        mockUploadReferenceDataNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await uploadReferenceData(inputMock);
            fail('uploadReferenceData did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
