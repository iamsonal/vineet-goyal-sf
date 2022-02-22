import {
    mockCreateAssetNetwokOnce,
    mockCreateAssetNetwokErrorOnce,
} from 'marketing-assetcreation-test-util';
import { createAsset } from 'lds-adapters-marketing-assetcreation';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/createAsset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test createAsset creation', async () => {
        const outputMock = getMock('CreateAssetOutput');
        const inputMock = getMock('CreateAssetInput');
        const config = {
            AssetInput: inputMock,
        };
        mockCreateAssetNetwokOnce(config, outputMock);

        const el = await createAsset(config);
        expect(el).toEqual(outputMock);
    });

    it('test createAsset error case', async () => {
        const inputMock = getMock('CreateAssetInput');
        const config = {
            AssetInput: inputMock,
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
        mockCreateAssetNetwokErrorOnce(config, mockErrorResponse);
        try {
            await createAsset(config);
            fail('createAsset did not throw when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
