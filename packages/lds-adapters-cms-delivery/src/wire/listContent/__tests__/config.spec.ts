import { listContentAdapterFactory as listContent } from '../../../generated/adapters/listContent';

describe('input config validation', () => {
    it('returns rejected promise for undefined communityId', async () => {
        expect(() => (listContent({} as any) as any)({})).toThrowError(
            'adapter listContent configuration must specify communityId'
        );
    });

    it('calls dispatchResourceRequest on valid input', async () => {
        const mockData = {};
        const mockLds = {
            dispatchResourceRequest: jest.fn().mockReturnValue({ then: () => {} }),
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: mockData }),
            storeIngest: jest.fn(),
            storeBroadcast: jest.fn(),
            snapshotDataAvailable: jest.fn(),
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
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
    });
});
