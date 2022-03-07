import {
    mockBeiNetworkOnce,
    mockBeiNetworkErrorOnce,
} from 'industries-sustainability-bei-test-util';
import { performBuildingEnergyIntensityCalculation } from 'lds-adapters-industries-sustainability-bei';
import { getMock as globalGetMock } from 'test-util';

const MOCK_INPUT_PREFIX = 'wire/bei/__karma__/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('bei test', () => {
    it('test positive case of bei', async () => {
        const outputMock = getInputMock('beiOutput');
        const config = {
            recordId: 'ABCDE',
        };
        mockBeiNetworkOnce(config, outputMock);

        const el = await performBuildingEnergyIntensityCalculation(config);
        expect(el).toEqual(outputMock);
    });

    it('test bei error case', async () => {
        const config = {
            recordId: 'ABCDE',
        };
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
        mockBeiNetworkErrorOnce(config, mockErrorResponse);
        try {
            await performBuildingEnergyIntensityCalculation(config);
            fail('bei did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
