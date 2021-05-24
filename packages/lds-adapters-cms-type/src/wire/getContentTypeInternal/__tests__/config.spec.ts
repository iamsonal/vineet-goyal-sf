import { getContentTypeInternalAdapterFactory as getContentTypeInternal } from '../../../generated/adapters/getContentTypeInternal';

describe('input config validation', () => {
    it('returns rejected promise for undefined contentTypeIdOrFQN', async () => {
        expect(() => (getContentTypeInternal({} as any) as any)({})).toThrowError(
            'adapter getContentTypeInternal configuration must specify contentTypeIdOrFQN'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getContentTypeInternal(mockLds as any)({
            contentTypeIdOrFQN: 'news',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
