import { getMock as globalGetMock } from 'test-util';
import { publishOrchestrationEvent } from 'lds-adapters-platform-interaction-orchestrator';
import {
    mockPublishOrchestrationEventNetworkOnce,
    mockPublishOrchestrationEventNetworkErrorOnce,
} from 'platform-interaction-orchestrator-test-util';

const MOCK_PREFIX = 'wire/publishOrchestrationEvent/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('publishes an orchestration event', async () => {
        const mockConfig = getMock('orchestration-event');
        const mockResponse = getMock('orchestration-event');

        mockPublishOrchestrationEventNetworkOnce(mockConfig, mockResponse);

        const data = await publishOrchestrationEvent(mockConfig);

        expect(data.data).toEqual(mockResponse);
    });

    it('displays error when network request 404s', async () => {
        const mockConfig = getMock('orchestration-event');
        const mockResponse = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockPublishOrchestrationEventNetworkErrorOnce(mockConfig, mockResponse);
        try {
            await publishOrchestrationEvent(mockConfig);
            // make sure we are hitting the catch
            fail('publishOrchestrationEvent did not throw an error when expected to');
        } catch (e) {
            expect(e).toContainErrorResponse(mockResponse);
        }
    });
});
