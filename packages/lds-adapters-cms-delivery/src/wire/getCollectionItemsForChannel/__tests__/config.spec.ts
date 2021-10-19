import { getCollectionItemsForChannelAdapterFactory as getCollectionItems } from '../../../generated/adapters/getCollectionItemsForChannel';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (getCollectionItems({} as any) as any)({})).toThrowError(
            'adapter getCollectionItemsForChannel configuration must specify channelId, collectionKeyOrId'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getCollectionItems(mockLds as any)({
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
            channelId: '0apT300000000HLIAY',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
