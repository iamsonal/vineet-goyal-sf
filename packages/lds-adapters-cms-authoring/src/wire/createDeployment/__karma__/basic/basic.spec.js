import {
    mockCreateDeployment,
    mockCreateDeploymentsErrorOnce,
} from '../../../../../karma/cms-authoring-test-util';
import { createDeployment } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createDeployment/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test create deployment happy case with all input fields', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deploymentInputWithAllFields');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('test create deployment happy case  with minimum input fields', async () => {
        const mock = getMock('createDepResponse');
        const testInput = getMock('deploymentInputWithMinimumFields');

        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('test create deployment happy case with nullable output fields', async () => {
        const mock = getMock('createDepResponseWithNulls');
        const testInput = getMock('deploymentInputWithAllFields2');
        mockCreateDeployment(testInput, mock);

        const el = await createDeployment(testInput);
        expect(el).toEqual(mock);
    });

    it('test create deployment error case', async () => {
        const testInput = getMock('deploymentInputWithAllFields3');
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
            expect(e).toContainErrorResponse(mockErrorResponse);
        }
    });
});
