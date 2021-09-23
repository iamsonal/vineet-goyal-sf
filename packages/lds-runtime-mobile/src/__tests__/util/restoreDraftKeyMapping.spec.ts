import { restoreDraftKeyMapping } from '../../utils/restoreDraftKeyMapping';
import { Luvio } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';

// Mock Luvio
const storeBroadcastMock = jest.fn().mockName('storeBroadcastMock');
const storeRedirectMock = jest.fn().mockName('storeRedirectMock');
const mockLuvio = {
    storeRedirect: storeRedirectMock,
    storeBroadcast: storeBroadcastMock,
} as unknown as Luvio;

// Mock Durable Store
const mockData = (id: string) => ({
    data: {
        draftId: `draft-id-${id}`,
        canonicalId: `canonical-id-${id}`,
    },
});
const mockGetAllEntries = jest.fn().mockName('mockGetAllEntries').mockResolvedValue({});
const mockDurableStore = {
    getAllEntries: mockGetAllEntries,
} as unknown as DurableStore;

describe('restoreDraftKeyMapping', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call store redirect in Luvio', async () => {
        // Arrange
        mockGetAllEntries.mockResolvedValueOnce({
            key0: mockData('0'),
            key1: mockData('1'),
        });

        // Act
        await restoreDraftKeyMapping(mockLuvio, mockDurableStore);

        // Assert
        expect(storeRedirectMock).toBeCalledTimes(2);
        expect(storeRedirectMock.mock.calls[0]).toEqual([
            'UiApi::RecordRepresentation:draft-id-0',
            'UiApi::RecordRepresentation:canonical-id-0',
        ]);
        expect(storeRedirectMock.mock.calls[1]).toEqual([
            'UiApi::RecordRepresentation:draft-id-1',
            'UiApi::RecordRepresentation:canonical-id-1',
        ]);

        expect(storeBroadcastMock).toBeCalledTimes(1);
    });

    it('should not call store broadcast if there are no entries', async () => {
        // Arrange

        // Act
        await restoreDraftKeyMapping(mockLuvio, mockDurableStore);

        // Assert
        expect(storeRedirectMock).toBeCalledTimes(0);
        expect(storeBroadcastMock).toBeCalledTimes(0);
    });

    it('should not call store broadcast if mapping entries are undefined', async () => {
        // Arrange
        mockGetAllEntries.mockResolvedValueOnce(undefined);

        // Act
        await restoreDraftKeyMapping(mockLuvio, mockDurableStore);

        // Assert
        expect(storeRedirectMock).toBeCalledTimes(0);
        expect(storeBroadcastMock).toBeCalledTimes(0);
    });
});
