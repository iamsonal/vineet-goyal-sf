import { getCollectionMetadataForSiteAdapterFactory as getCollectionMetadata } from '../../../generated/adapters/getCollectionMetadataForSite';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (getCollectionMetadata({} as any) as any)({})).toThrowError(
            'adapter getCollectionMetadataForSite configuration must specify collectionKeyOrId, siteId'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getCollectionMetadata(mockLds as any)({
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
            siteId: '0DMT300000000idOAA',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
