import { getContentTypeAdapterFactory as getContentType } from '../../../generated/adapters/getContentType';

describe('input config validation', () => {
    it('returns rejected promise for undefined contentTypeFQN', async () => {
        expect(() => (getContentType({} as any) as any)({})).toThrowError(
            'adapter getContentType configuration must specify contentTypeFQN'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getContentType(mockLds as any)({
            contentTypeFQN: 'news',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
