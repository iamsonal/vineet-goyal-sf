import { getMock } from 'test-util';
import { resumeFlow } from 'lds-adapters-platform-flow';
import {
    mockResumeFlowNetworkOnce,
    mockResumeFlowNetworkSequence,
    mockResumeFlowNetworkErrorOnce,
} from 'platform-flow-test-util';

const MOCK_PREFIX = '__karma__/data/';

describe('resumeFlow', () => {
    it('resumes a flow', async () => {
        const mockConfig = {
            flowDevName: 'flow1',
            pausedInterviewId: '123',
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_1');
        mockResumeFlowNetworkOnce(mockConfig, mockResponse);
        const data = await resumeFlow(mockConfig);
        expect(data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('does not use cache', async () => {
        const mockConfig = {
            flowDevName: 'flow2',
            pausedInterviewId: '1234',
        };
        const mockResponse = getMock(MOCK_PREFIX + 'response_sequence_1');
        expect(mockResponse[0]).not.toEqual(mockResponse[1]);
        mockResumeFlowNetworkSequence(mockConfig, mockResponse);
        const data0 = await resumeFlow(mockConfig);
        expect(data0).toEqualSnapshotWithoutEtags(mockResponse[0]);
        const data1 = await resumeFlow(mockConfig);
        expect(data1).toEqualSnapshotWithoutEtags(mockResponse[1]);
    });

    it('errors out on flow not found', async () => {
        const mockConfig = {
            flowDevName: 'flow2',
            pausedInterviewId: '123',
        };
        const mockResponse = {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        };
        mockResumeFlowNetworkErrorOnce(mockConfig, mockResponse);
        try {
            await resumeFlow(mockConfig);
            fail('runFlow did not error out');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e).toEqual(jasmine.objectContaining({ message: mockResponse.message }));
        }
    });
});
