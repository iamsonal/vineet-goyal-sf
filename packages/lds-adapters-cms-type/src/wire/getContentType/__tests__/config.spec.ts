import { getContentTypeAdapterFactory as getContentType } from '../../../generated/adapters/getContentType';

describe('input config validation', () => {
    it('returns rejected promise for undefined contentTypeFQN', async () => {
        expect(() => (getContentType({} as any) as any)({})).toThrowError(
            'adapter getContentType configuration must specify contentTypeFQN'
        );
    });

    it('calls dispatchResourceRequest on valid input', async () => {
        const mockData = {};
        const mockLds = {
            dispatchResourceRequest: jest.fn().mockReturnValue({ then: () => {} }),
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: mockData }),
            storeIngest: jest.fn(),
            storeBroadcast: jest.fn(),
            snapshotAvailable: jest.fn(),
        };
        await getContentType(mockLds as any)({
            contentTypeFQN: 'news',
        });
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
    });
});
