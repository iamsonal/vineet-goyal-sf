import { getMock } from 'test-util';
import { startFlow } from 'lds-adapters-platform-flow';
import {
    mockStartFlowNetworkOnce,
    mockStartFlowNetworkSequence,
    mockStartFlowNetworkErrorOnce,
} from 'platform-flow-test-util';

const MOCK_PREFIX = '__karma__/data/';

describe('startFlow', () => {
    it('starts a flow', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            flowVersionId: '123',
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_1');
        mockStartFlowNetworkOnce(mockConfig, mockResponse);
        const data = await startFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('starts a flow when version id is not supplied', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_1');
        mockStartFlowNetworkOnce(mockConfig, mockResponse);
        const data = await startFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('does not use cache', async () => {
        const mockConfig = {
            flowDevName: 'flow133',
            flowVersionId: '12367',
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_sequence_1');
        expect(mockResponse[0]).not.toEqual(mockResponse[1]);
        mockStartFlowNetworkSequence(mockConfig, mockResponse);
        const data0 = await startFlow(mockConfig);
        expect(data0).toEqualSnapshotWithoutEtags(mockResponse[0]);
        const data1 = await startFlow(mockConfig);
        expect(data1).toEqualSnapshotWithoutEtags(mockResponse[1]);
    });

    it('errors out on flow not found', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            flowVersionId: '123',
        };
        const mockError = {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        };
        mockStartFlowNetworkErrorOnce(mockConfig, {
            body: mockError,
        });
        try {
            await startFlow(mockConfig);
            fail('startFlow did not error out');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toEqual(mockError.message);
        }
    });

    it('errors out on disconnect', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            flowVersionId: '123',
        };
        const mockError = {
            error: 'Disconnected or canceled',
        };
        mockStartFlowNetworkErrorOnce(mockConfig, {
            body: mockError,
        });
        try {
            await startFlow(mockConfig);
            fail('startFlow did not error out');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toEqual(mockError.error);
        }
    });

    it('ingests a response with null response property', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            flowVersionId: '123',
        };
        mockStartFlowNetworkOnce(mockConfig, {
            error: 'Some error message',
            response: null,
        });
        const data = await startFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags({
            error: 'Some error message',
            response: null,
        });
    });
});
