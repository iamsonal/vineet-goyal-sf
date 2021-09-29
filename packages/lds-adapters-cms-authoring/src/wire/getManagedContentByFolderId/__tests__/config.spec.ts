import { getManagedContentByFolderIdAdapterFactory as getManagedContentByFolderId } from '../../../generated/adapters/getManagedContentByFolderId';

describe('input config validation', () => {
    it('returns rejected promise for undefined folderId', async () => {
        expect(() => (getManagedContentByFolderId({} as any) as any)({})).toThrowError(
            'adapter getManagedContentByFolderId configuration must specify folderId'
        );
    });

    it('calls storeLookup on valid input', async () => {
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getManagedContentByFolderId(mockLds as any)({
            folderId: '9PuRM00000003B60AI',
        });
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
});
