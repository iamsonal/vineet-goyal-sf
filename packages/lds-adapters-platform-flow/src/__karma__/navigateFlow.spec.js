import { getMock } from 'test-util';
import { navigateFlow } from 'lds-adapters-platform-flow';
import {
    mockNavigateFlowNetworkOnce,
    mockNavigateFlowNetworkSequence,
    mockNavigateFlowNetworkErrorOnce,
} from 'platform-flow-test-util';

const MOCK_PREFIX = '__karma__/data/';

describe('navigateFlow', () => {
    it('executes a flow action', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            request: {
                action: 'NEXT',
                serializedState: 'ABC',
            },
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_1');
        mockNavigateFlowNetworkOnce(mockConfig, mockResponse);
        const data = await navigateFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    /**
     * The test verifies absence of the use of the cache by ensuring that
     * responses for subsequent requests with same inputs are different.
     */
    it('does not use cache', async () => {
        const mockConfig = {
            flowDevName: 'flow12',
            request: {
                action: 'NEXT',
                serializedState: 'ABCD',
            },
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_sequence_1');
        expect(mockResponse[0]).not.toEqual(mockResponse[1]);
        mockNavigateFlowNetworkSequence(mockConfig, mockResponse);
        const data0 = await navigateFlow(mockConfig);
        expect(data0).toEqualSnapshotWithoutEtags(mockResponse[0]);
        const data1 = await navigateFlow(mockConfig);
        expect(data1).toEqualSnapshotWithoutEtags(mockResponse[1]);
    });

    it('errors out on flow not found', async () => {
        const mockConfig = {
            flowDevName: 'flow2',
            request: {
                action: 'NEXT',
                serializedState: 'ABC',
            },
        };
        const mockError = {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        };
        mockNavigateFlowNetworkErrorOnce(mockConfig, {
            body: mockError,
        });
        try {
            await navigateFlow(mockConfig);
            fail('runFlow did not error out');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toEqual(mockError.message);
        }
    });

    it('errors out on disconnect', async () => {
        const mockConfig = {
            flowDevName: 'flow2',
            request: {
                action: 'NEXT',
                serializedState: 'ABC',
            },
        };
        const mockError = {
            error: 'Disconnected or canceled',
        };
        mockNavigateFlowNetworkErrorOnce(mockConfig, {
            body: mockError,
        });
        try {
            await navigateFlow(mockConfig);
            fail('runFlow did not error out');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toEqual(mockError.error);
        }
    });

    it('ingests a response with null response property', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            request: {
                action: 'NEXT',
                serializedState: 'ABC',
            },
        };
        mockNavigateFlowNetworkOnce(mockConfig, {
            error: 'Some error message',
            response: null,
        });
        const data = await navigateFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags({
            error: 'Some error message',
            response: null,
        });
    });

    describe('navigates a flow when isVisible on a field is not supplied or null', () => {
        const mockConfig = {
            flowDevName: 'flow1',
            request: {
                action: 'NEXT',
                serializedState: 'ABC',
                fields: [
                    {
                        field: 'checkbox_group',
                    },
                ],
            },
        };

        it('navigates a flow when isVisible on a field is not supplied', async () => {
            const mockResponse = getMock(MOCK_PREFIX + 'response_1');
            mockNavigateFlowNetworkOnce(mockConfig, mockResponse);
            const data = await navigateFlow(mockConfig);
            expect(data).toEqualSnapshotWithoutEtags(mockResponse);
        });

        it('navigates a flow when isVisible on a field is null', async () => {
            mockConfig.request.fields[0].isVisible = null;
            const mockResponse = getMock(MOCK_PREFIX + 'response_1');
            mockNavigateFlowNetworkOnce(mockConfig, mockResponse);
            const data = await navigateFlow(mockConfig);
            expect(data).toEqualSnapshotWithoutEtags(mockResponse);
        });
    });
});
