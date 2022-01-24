import {
    mockCreateDeployment,
    mockCreateDeploymentsErrorOnce,
} from '../../../../../karma/cms-authoring-test-util';
import { createDeployment } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createDeployment/__karma__/data/';

const MOCK_SINGLE_CONTENT_ERROR_RESPONSE = {
    ok: false,
    status: 404,
    statusText: 'INVALID_API_INPUT',
    body: [
        {
            errorCode: 'INVALID_API_INPUT',
            message: 'A single content is expected when IncludeContentReferences is set.',
        },
    ],
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates deployment for content to select channels without references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployContentToSelectChannelsWithoutReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for contentIds to select channels with references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployContentToSelectChannelsWithReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for content to all channels without references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployContentToAllChannelsWithoutReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for content to all channels with references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployContentToAllChannelsWithReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for variants to select channels with references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployVariantsToSelectChannelsWithReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for variants to all channels with references', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployVariantsToAllChannelsWithReferences');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment with nullable output fields', async () => {
        const mock = getMock('createDepResponseWithNulls');
        const testInput = getMock('deploymentInputWithAllFields');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('creates deployment for all content within space', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deployAllContentInSpace');

        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('fails to create deployment for invalid space', async () => {
        const testInput = getMock('deployContentForInvalidSpace');
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
        mockCreateDeploymentsErrorOnce(testInput, mockErrorResponse);
        try {
            await createDeployment(testInput);
            fail('createDeployment did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });

    it('fails to create deployment for empty content with references', async () => {
        const testInput = getMock('deployEmptyContentWithReferences');
        mockCreateDeploymentsErrorOnce(testInput, MOCK_SINGLE_CONTENT_ERROR_RESPONSE);
        try {
            await createDeployment(testInput);
            fail('createDeployment did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(MOCK_SINGLE_CONTENT_ERROR_RESPONSE);
        }
    });

    it('fails to create deployment multiple content with references', async () => {
        const testInput = getMock('deployMultipleContentWithReferences');
        mockCreateDeploymentsErrorOnce(testInput, MOCK_SINGLE_CONTENT_ERROR_RESPONSE);
        try {
            await createDeployment(testInput);
            fail('createDeployment did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(MOCK_SINGLE_CONTENT_ERROR_RESPONSE);
        }
    });

    it('fails to create deployment with both content and variants', async () => {
        const testInput = getMock('deployBothContentAndVariants');
        const mockErrorResponse = {
            ok: false,
            status: 404,
            statusText: 'INVALID_API_INPUT',
            body: [
                {
                    errorCode: 'INVALID_API_INPUT',
                    message: 'Not valid to have both contentIds and variantIds.',
                },
            ],
        };
        mockCreateDeploymentsErrorOnce(testInput, mockErrorResponse);
        try {
            await createDeployment(testInput);
            fail('createDeployment did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
