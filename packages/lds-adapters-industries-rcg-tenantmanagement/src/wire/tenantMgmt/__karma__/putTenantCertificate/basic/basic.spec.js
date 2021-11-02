import {
    mockPutTeneantCertificateNetworkOnce,
    mockPutTeneantCertificateNetworkErrorOnce,
} from 'industries-rcg-tenantmanagement-test-util';
import { putTenantCertificate } from 'lds-adapters-industries-rcg-tenantmanagement';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/tenantMgmt/__karma__/putTenantCertificate/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('putTenantCertificate test', () => {
    it('test positive case of putting tenant certificate', async () => {
        const inputMock = getInputMock('input');
        const outputMock = getInputMock('putTenantCertificateOutput');

        mockPutTeneantCertificateNetworkOnce(outputMock);

        const el = await putTenantCertificate(inputMock);
        expect(el).toEqual(outputMock);
    });

    it('test error case of put tenant certificate', async () => {
        const inputMock = getInputMock('input');
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
        mockPutTeneantCertificateNetworkErrorOnce(mockErrorResponse);
        try {
            await putTenantCertificate(inputMock);
            fail('putTenantCertificate did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
