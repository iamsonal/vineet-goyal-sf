import { getMock as globalGetMock, setupElement, clearCache } from 'test-util';
import {
    mockGetOrchestrationInstanceCollectionNetworkOnce,
    mockGetOrchestrationInstanceCollectionNetworkErrorOnce,
    mockGetOrchestrationInstanceCollectionNetworkSequence,
} from 'platform-interaction-orchestrator-test-util';
import GetOrchestrationInstanceCollection from '../lwc/get-orchestration-instance-collection';

const MOCK_PREFIX = 'wire/getOrchestrationInstanceCollection/__karma__/data/';
const TEST_CONFIG = { relatedRecordId: 'A Sample Record ID' };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets an orchestration instance collection - given a relatedRecordId', async () => {
        const mock = getMock('orchestration-instance-collection');

        mockGetOrchestrationInstanceCollectionNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('orchestration-instance-collection');

        mockGetOrchestrationInstanceCollectionNetworkOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getData()).toEqual(mock);
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

        mockGetOrchestrationInstanceCollectionNetworkErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('should refetch the orchestration instance collection properties when ingested properties error TTLs out', async () => {
        const mock = getMock('orchestration-instance-collection');

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

        mockGetOrchestrationInstanceCollectionNetworkSequence(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const el1 = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el1.getError()).toEqual(mockError);

        clearCache();

        const el2 = await setupElement(TEST_CONFIG, GetOrchestrationInstanceCollection);
        expect(el2.getError()).toBeUndefined();
        expect(el2.getData()).toEqual(mock);
    });
});
