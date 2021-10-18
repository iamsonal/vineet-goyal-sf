import { getManagedContentVariantAdapterFactory as getManagedContentVariant } from '../../../generated/adapters/getManagedContentVariant';

describe('input config validation', () => {
    it('returns rejected promise for undefined variantId', async () => {
        expect(() => (getManagedContentVariant({} as any) as any)({})).toThrowError(
            'adapter getManagedContentVariant configuration must specify variantId'
        );
    });

    it('calls applyCachePolicy on valid input', async () => {
        const mockLds = {
            applyCachePolicy: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getManagedContentVariant(mockLds as any)({
            variantId: '9Psxx0000004CKKCA2',
        });
        expect(mockLds.applyCachePolicy.mock.calls.length).toBe(1);
    });
});
