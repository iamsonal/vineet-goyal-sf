import { listContentAdapterFactory as listContent } from '../../../generated/adapters/listContent';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (listContent({} as any) as any)({})).toThrowError(
            'adapter listContent configuration must specify communityId'
        );
    });

    it('calls applyCachePolicy on valid input', async () => {
        const mockLds = {
            applyCachePolicy: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await listContent(mockLds as any)({
            communityId: '123456781234567',
            contentKeys: ['123456789012345678'],
            language: 'en_US',
            managedContentType: 'news',
            page: 1,
            pageSize: 20,
            showAbsoluteUrl: false,
            topics: ['Topic 1'],
        });
        expect(mockLds.applyCachePolicy.mock.calls.length).toBe(1);
    });
});
