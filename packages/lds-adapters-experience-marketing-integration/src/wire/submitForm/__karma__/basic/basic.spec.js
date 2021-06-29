import { submitForm } from 'lds-adapters-experience-marketing-integration';
import { getMock as globalGetMock } from 'test-util';
import {
    mockSubmitFormNetworkOnce,
    mockSubmitFormInvalidSiteIdNetworkErrorOnce,
} from 'experience-marketing-integration-test-util';

const MOCK_PREFIX = 'wire/submitForm/__karma__/data/';

const mockFormData = {
    formFieldsList: [
        {
            name: 'First Name',
            value: 'Tom',
        },
        {
            name: 'Last Name',
            value: 'Bob',
        },
        {
            name: 'Email',
            value: 'tom@gmail.com',
        },
    ],
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('submit form', async () => {
        const mockRespose = getMock('form');
        const config = {
            formId: 'test_form_id',
            siteId: '0DM000000000000000',
            ...mockFormData,
        };
        mockSubmitFormNetworkOnce(config, mockRespose);

        const data = await submitForm(config);

        expect(data).toEqualWithExtraNestedData(mockRespose);
    });
    it('displays error when network request 400s', async () => {
        const mock = {
            status: 400,
            ok: false,
            body: [
                {
                    errorCode: 'INVALID_ID_FIELD',
                    message: 'Specify a valid site ID',
                    dataExtensionId: '',
                },
            ],
        };
        const config = {
            formId: 'test_form_id',
            siteId: 'invalidSiteId',
            ...mockFormData,
        };
        mockSubmitFormInvalidSiteIdNetworkErrorOnce(config, mock);

        try {
            await submitForm(config);
            // make sure we are hitting the catch
            fail('saveForm did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
