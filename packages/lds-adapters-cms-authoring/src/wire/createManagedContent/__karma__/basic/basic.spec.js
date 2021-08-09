import {
    mockCreateManagedContent,
    mockCreateManagedContentErrorOnce,
} from '../../../../../karma/cms-authoring-test-util';
import { createManagedContent } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createManagedContent/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test create managed content happy case with all input fields', async () => {
        const mock = getMock('createManagedContentResponse');
        const testInput = getMock('createManagedContentInputWithAllFields');
        mockCreateManagedContent(testInput, mock);

        const el = await createManagedContent(testInput);
        expect(el).toEqual(mock);
    });

    it('test create managed content error case', async () => {
        const testInput = getMock('createManagedContentInputWithAllFields');
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
        mockCreateManagedContentErrorOnce(testInput, mockErrorResponse);
        try {
            await createManagedContent(testInput);
            fail('createManagedContent did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
