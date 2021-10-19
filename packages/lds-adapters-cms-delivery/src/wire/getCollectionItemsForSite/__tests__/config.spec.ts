import { getCollectionItemsForSiteAdapterFactory as getCollectionItems } from '../../../generated/adapters/getCollectionItemsForSite';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (getCollectionItems({} as any) as any)({})).toThrowError(
            'adapter getCollectionItemsForSite configuration must specify collectionKeyOrId, siteId'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getCollectionItems(mockLds as any)({
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
            siteId: '0DMT300000000idOAA',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
