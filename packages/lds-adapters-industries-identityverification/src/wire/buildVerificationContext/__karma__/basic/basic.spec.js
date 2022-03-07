import {
    mockBuildVerificationContextNetworkOnce,
    mockBuildVerificationContextNetworkErrorOnce,
} from 'industries-identityverification-test-util';
import { buildVerificationContext } from 'lds-adapters-industries-identityverification';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/buildVerificationContext/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('basic', () => {
    it('test basic buildVerificationContext', async () => {
        const inputMock = getDataMock('BuildVerificationContextInput');
        const outputMock = getDataMock('BuildVerificationContextOutput');
        mockBuildVerificationContextNetworkOnce(inputMock, outputMock);

        const el = await buildVerificationContext({
            BuildContextData: inputMock,
            processDefinitionName: 'SampleVerificationFlow',
        });
        expect(el).toEqual(outputMock);
    });

    it('test buildVerificationContext error case', async () => {
        const inputMock = getDataMock('BuildVerificationContextInput');
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
        mockBuildVerificationContextNetworkErrorOnce(inputMock, mockErrorResponse);
        try {
            await buildVerificationContext({
                BuildContextData: inputMock,
                processDefinitionName: 'SampleVerificationFlow',
            });
            fail('searchRecords did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
