import { getCollectionMetadataForChannelAdapterFactory as getCollectionMetadata } from '../../../generated/adapters/getCollectionMetadataForChannel';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (getCollectionMetadata({} as any) as any)({})).toThrowError(
            'adapter getCollectionMetadataForChannel configuration must specify channelId, collectionKeyOrId'
        );
    });

    it('calls applyCachePolicy on valid input', async () => {
        const mockLds = {
            applyCachePolicy: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getCollectionMetadata(mockLds as any)({
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
            channelId: '0apT300000000HLIAY',
        });
        expect(mockLds.applyCachePolicy.mock.calls.length).toBe(1);
    });
});
