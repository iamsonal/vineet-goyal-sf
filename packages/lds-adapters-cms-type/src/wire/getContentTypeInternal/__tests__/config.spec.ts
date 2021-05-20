import { getContentTypeInternalAdapterFactory as getContentTypeInternal } from '../../../generated/adapters/getContentTypeInternal';

describe('input config validation', () => {
    it('returns rejected promise for undefined contentTypeIdOrFQN', async () => {
        expect(() => (getContentTypeInternal({} as any) as any)({})).toThrowError(
            'adapter getContentTypeInternal configuration must specify contentTypeIdOrFQN'
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
        await getContentTypeInternal(mockLds as any)({
            contentTypeIdOrFQN: 'news',
        });
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
    });
});
