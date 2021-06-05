import {
    mockReplaceManagedContentVariant,
    mockReplaceManagedContentVariantErrorOnce,
} from '../../../../../karma/cms-authoring-test-util';
import { replaceManagedContentVariant } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/replaceManagedContentVariant/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test replace managed content variant happy case with all input fields', async () => {
        const mock = getMock('replaceManagedContentVariantResponse');
        const testInput = getMock('replaceManagedContentVariantInputWithAllFields');
        mockReplaceManagedContentVariant(testInput, mock);

        const el = await replaceManagedContentVariant(testInput);
        expect(el.data).toEqual(mock);
    });

    it('test replace managed content variant error case', async () => {
        const testInput = getMock('replaceManagedContentVariantInputWithAllFields');
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
        mockReplaceManagedContentVariantErrorOnce(testInput, mockErrorResponse);
        try {
            await replaceManagedContentVariant(testInput);
            fail('replaceManagedContentVariant did not throw an error when expected to');
        } catch (e) {
            expect(e).toContainErrorResponse(mockErrorResponse);
        }
    });
});
