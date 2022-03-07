import {
    mockUnpublishManagedContent,
    mockUnpublishManagedContentErrorOnce,
} from '../../../../../karma/cms-authoring-test-util';
import { unpublishManagedContent } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/unpublishManagedContent/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('unpublishes managed content for the provided channel', async () => {
        const mock = getMock('unpublishResponse');
        const testInput = getMock('unpublishManagedContents');
        mockUnpublishManagedContent(testInput, mock);

        const el = await unpublishManagedContent(testInput);
        expect(el).toEqual(mock);
    });

    it('unpublishes managed content variants for the provided channel', async () => {
        const mock = getMock('unpublishResponse');
        const testInput = getMock('unpublishManagedContentVariants');
        mockUnpublishManagedContent(testInput, mock);

        const el = await unpublishManagedContent(testInput);
        expect(el).toEqual(mock);
    });

    it('unpublish managed content error case', async () => {
        const testInput = getMock('unpublishManagedContents');
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
        mockUnpublishManagedContentErrorOnce(testInput, mockErrorResponse);
        try {
            await unpublishManagedContent(testInput);
            fail('unpublishManagedContent did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
