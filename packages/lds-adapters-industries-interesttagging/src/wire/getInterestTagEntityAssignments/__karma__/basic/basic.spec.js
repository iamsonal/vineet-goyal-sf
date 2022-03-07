import {
    clone,
    mockGetInterestTagEntityAssignmentsNetworkOnce,
    mockGetInterestTagEntityAssignmentsNetworkErrorOnce,
    mockGetInterestTagEntityAssignmentsNetworkSequence,
    expireGetInterestTagEntityAssignments,
} from 'industries-interesttagging-test-util';
import { getMock as globalGetMock, setupElement, clearCache } from 'test-util';
import GetInterestTagEntityAssignments from '../lwc/get-interest-tag-entity-assignments';

const MOCK_DATA_PATH = 'wire/getInterestTagEntityAssignments/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_DATA_PATH + filename);
}

const MOCK_TEST_CONFIG = {
    tagId: 'mockId',
};

describe('basic getInterestTagEntityAssignments tests', () => {
    it('test Basic Cache Miss Scenario- tagDetails using getInterestTagEntityAssignments', async () => {
        const outputMock = getDataMock('TagRecordAssignmentCollectionRepresentation');
        mockGetInterestTagEntityAssignmentsNetworkOnce(MOCK_TEST_CONFIG, outputMock);

        const element = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(clone(element.getWiredRecordDetail())).toEqual(outputMock);
    });

    it('test Basic Cache Hit Scenario- do not fetch recordDetails second time', async () => {
        const outputMock = getDataMock('TagRecordAssignmentCollectionRepresentation');

        mockGetInterestTagEntityAssignmentsNetworkOnce(MOCK_TEST_CONFIG, outputMock);

        const el = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRecordDetail())).toEqual(outputMock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredRecordDetail())).toEqual(outputMock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const outputMock = getDataMock('TagRecordAssignmentCollectionRepresentation');

        const mockTestConfig2 = {
            tagId: 'mockId2',
        };

        mockGetInterestTagEntityAssignmentsNetworkOnce(MOCK_TEST_CONFIG, outputMock);
        mockGetInterestTagEntityAssignmentsNetworkOnce(mockTestConfig2, outputMock);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el1.getWiredRecordDetail()).toEqual(outputMock);

        const el2 = await setupElement(mockTestConfig2, GetInterestTagEntityAssignments);
        expect(el2.getWiredRecordDetail()).toEqual(outputMock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('test Expired Data Cache Miss Scenario- should hit network if details are available but expired', async () => {
        const outputMock = getDataMock('TagRecordAssignmentCollectionRepresentation');

        mockGetInterestTagEntityAssignmentsNetworkSequence(MOCK_TEST_CONFIG, [
            outputMock,
            outputMock,
        ]);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredRecordDetail()).toEqual(outputMock);

        expireGetInterestTagEntityAssignments();

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredRecordDetail()).toEqual(outputMock);

        // el1 should not have received new value
        expect(el1.pushCount()).toBe(1);
    });

    it('test Server 404 Emits Correctly to Component- displays error when network request 404s', async () => {
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
        mockGetInterestTagEntityAssignmentsNetworkErrorOnce(MOCK_TEST_CONFIG, mock);

        const el = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqualImmutable(mock);
    });

    it('test Server 404 Cache Hit Scenario- should cause a cache hit when details are queried after server returned 404', async () => {
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

        mockGetInterestTagEntityAssignmentsNetworkOnce(MOCK_TEST_CONFIG, {
            reject: true,
            data: mockError,
        });

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el1.getError()).toEqualImmutable(mockError);

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el2.getError()).toEqualImmutable(mockError);
    });

    it('test Expired Server 404 Cache Miss Scenario- should refetch details when ingested properties error TTLs out', async () => {
        const outputMock = getDataMock('TagRecordAssignmentCollectionRepresentation');

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

        mockGetInterestTagEntityAssignmentsNetworkSequence(MOCK_TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            outputMock,
        ]);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el1.getError()).toEqualImmutable(mockError);

        clearCache();

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetInterestTagEntityAssignments);
        expect(el2.error).toBeUndefined();
        expect(el2.getWiredRecordDetail()).toEqual(outputMock);
    });
});
