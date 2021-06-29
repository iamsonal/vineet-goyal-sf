import { saveForm } from 'lds-adapters-experience-marketing-integration';
import { getMock as globalGetMock } from 'test-util';
import {
    mockSaveFormNetworkOnce,
    mockSaveFormInvalidSiteIdNetworkErrorOnce,
} from 'experience-marketing-integration-test-util';

const MOCK_PREFIX = 'wire/saveForm/__karma__/data/';

const mockFormConfig = {
    formName: 'test_form_name',
    formFieldsList: [
        {
            name: 'First Name',
            type: 'Text',
        },
        {
            name: 'Last Name',
            type: 'Text',
        },
        {
            name: 'Email Address',
            type: 'EmailAddress',
        },
        {
            name: 'Phone Number',
            type: 'Number',
        },
        {
            name: 'Custom Field 1',
            type: 'Text',
        },
        {
            name: 'Custome Field 2',
            type: 'Text',
        },
    ],
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('saves form', async () => {
        const mockRespose = getMock('form');
        const config = {
            siteId: '0DM000000000000000',
            memberIdentificationCode: 'marketing-account-id',
            ...mockFormConfig,
        };
        mockSaveFormNetworkOnce(config, mockRespose);

        const data = await saveForm(config);

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
            siteId: 'invalidSiteId',
            memberIdentificationCode: 'marketing-account-id',
            ...mockFormConfig,
        };
        mockSaveFormInvalidSiteIdNetworkErrorOnce(config, mock);

        try {
            await saveForm(config);
            // make sure we are hitting the catch
            fail('saveForm did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
