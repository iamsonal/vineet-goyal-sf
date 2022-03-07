import {
    mockUpdateTenantCertificateNetworkOnce,
    mockUpdateTenantCertificateNetworkErrorOnce,
} from 'industries-rcg-tenantmanagement-test-util';
import { updateTenantCertificate } from 'lds-adapters-industries-rcg-tenantmanagement';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/tenantMgmt/__karma__/updateTenantCertificate/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('updateTenantCertificate test', () => {
    it('test positive case of putting tenant certificate', async () => {
        const inputMock = getInputMock('input');
        const outputMock = getInputMock('putTenantCertificateOutput');

        mockUpdateTenantCertificateNetworkOnce(outputMock);

        const el = await updateTenantCertificate(inputMock);
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
        mockUpdateTenantCertificateNetworkErrorOnce(mockErrorResponse);
        try {
            await updateTenantCertificate(inputMock);
            fail('updateTenantCertificate did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
