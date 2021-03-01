import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetOrchestrationInstanceNetworkOnce,
    mockGetOrchestrationInstanceNetworkErrorOnce,
    mockGetOrchestrationInstanceNetworkSequence,
    expireInteractionOrchestratorCaches,
} from 'platform-interaction-orchestrator-test-util';
import GetOrchestrationInstance from '../lwc/get-orchestration-instance';

const MOCK_PREFIX = 'wire/getOrchestrationInstance/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
function getMockConfig(filename) {
    return { instanceId: getMock(filename).id };
}

describe('basic', () => {
    it('gets an orchestration instance - given an instanceId', async () => {
        const mock = getMock('orchestration-instance');
        const config = getMockConfig('orchestration-instance');

        mockGetOrchestrationInstanceNetworkOnce(config, mock);

        const el = await setupElement(config, GetOrchestrationInstance);
        expect(el.pushCount()).toBe(1);
        expect(el.orchestrationInstanceData).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('orchestration-instance');
        const config = getMockConfig('orchestration-instance');

        mockGetOrchestrationInstanceNetworkOnce(config, mock);

        const el = await setupElement(config, GetOrchestrationInstance);
        expect(el.pushCount()).toBe(1);
        expect(el.orchestrationInstanceData).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetOrchestrationInstance);
        expect(el2.pushCount()).toBe(1);
        expect(el2.orchestrationInstanceData).toEqual(mock);
    });

    it('displays error when network request returns 404s', async () => {
        const mock = {
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
        const config = getMockConfig('orchestration-instance');

        mockGetOrchestrationInstanceNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetOrchestrationInstance);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('should hit network if orchestration instance properties are available but expired', async () => {
        const mock = getMock('orchestration-instance');
        const config = getMockConfig('orchestration-instance');

        mockGetOrchestrationInstanceNetworkSequence(config, [mock, mock]);

        const el1 = await setupElement(config, GetOrchestrationInstance);
        expect(el1.pushCount()).toBe(1);
        expect(el1.orchestrationInstanceData).toEqual(mock);

        expireInteractionOrchestratorCaches();

        const el2 = await setupElement(config, GetOrchestrationInstance);
        expect(el2.pushCount()).toBe(1);
        expect(el2.orchestrationInstanceData).toEqual(mock);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
    });

    it('should cause a cache hit when orchestration instance properties are queried after server returned 404', async () => {
        const mockError = {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        };
        const config = getMockConfig('orchestration-instance');

        mockGetOrchestrationInstanceNetworkOnce(config, {
            reject: true,
            status: 404,
            statusText: 'Not Found',
            ok: false,
            data: mockError,
        });

        const expectedError = {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        };

        const el1 = await setupElement(config, GetOrchestrationInstance);
        expect(el1.getError()).toEqual(expectedError);
        expect(el1.getError()).toBeImmutable();

        const el2 = await setupElement(config, GetOrchestrationInstance);
        expect(el2.getError()).toEqual(expectedError);
        expect(el2.getError()).toBeImmutable();
    });

    it('should refetch orchestration instance properties when ingested properties error TTLs out', async () => {
        const mock = getMock('orchestration-instance');
        const config = getMockConfig('orchestration-instance');

        const mockError = {
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

        mockGetOrchestrationInstanceNetworkSequence(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'NOT_FOUND',
            ok: false,
            body: mockError.body,
        };

        const el1 = await setupElement(config, GetOrchestrationInstance);
        expect(el1.getError()).toEqual(expectedError);

        expireInteractionOrchestratorCaches();

        const el2 = await setupElement(config, GetOrchestrationInstance);
        expect(el2.error).toBeUndefined();
        expect(el2.orchestrationInstanceData).toEqual(mock);
    });
});
