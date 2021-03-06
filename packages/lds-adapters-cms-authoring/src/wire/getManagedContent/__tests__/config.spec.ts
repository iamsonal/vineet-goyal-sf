import { getManagedContentAdapterFactory as getManagedContent } from '../../../generated/adapters/getManagedContent';

describe('input config validation', () => {
    it('returns rejected promise for undefined contentKeyOrId', async () => {
        expect(() => (getManagedContent({} as any) as any)({})).toThrowError(
            'adapter getManagedContent configuration must specify contentKeyOrId'
        );
    });

    it('calls applyCachePolicy on valid input', async () => {
        const mockLds = {
            applyCachePolicy: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getManagedContent(mockLds as any)({
            contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
            version: '5OUxx0000004DMqGAM',
            language: 'en_US',
        });
        expect(mockLds.applyCachePolicy.mock.calls.length).toBe(1);
    });
});
