import {
    mockIdentityVerificationNetworkOnce,
    mockIdentityVerificationNetworkErrorOnce,
} from 'industries-identityverification-test-util';
import { identityVerification } from 'lds-adapters-industries-identityverification';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/identityVerification/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic identityVerification', async () => {
        const inputMock = getDataMock('IdentityVerificationInput');
        const outputMock = getDataMock('IdentityVerificationOutput');
        mockIdentityVerificationNetworkOnce(inputMock, outputMock);

        const el = await identityVerification(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test identityVerification error case', async () => {
        const inputMock = getDataMock('IdentityVerificationInput');
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
        mockIdentityVerificationNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await identityVerification(inputMock);
            fail('identityVerification did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
