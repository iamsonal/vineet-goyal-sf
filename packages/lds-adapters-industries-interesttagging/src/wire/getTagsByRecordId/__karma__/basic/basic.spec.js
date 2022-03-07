import {
    clone,
    mockGetTagsByRecordIdNetworkOnce,
    mockGetTagsByRecordIdNetworkErrorOnce,
    mockGetTagsByRecordIdNetworkSequence,
    expireGetTagsByRecordId,
} from 'industries-interesttagging-test-util';
import { getMock as globalGetMock, setupElement, clearCache } from 'test-util';
import GetTagsByRecordId from '../lwc/get-tags-by-record-id';

const MOCK_DATA_PATH = 'wire/getTagsByRecordId/__karma__/data/';

function getDataMock(filename) {
    return globalGetMock(MOCK_DATA_PATH + filename);
}

const MOCK_TEST_CONFIG = {
    recordId: 'mockId',
};

describe('basic getTagsByRecordId tests', () => {
    it('test Basic Cache Miss Scenario- tagDetails using getTagsByRecordId', async () => {
        const outputMock = getDataMock('InterestTagListRepresentation');
        mockGetTagsByRecordIdNetworkOnce(MOCK_TEST_CONFIG, outputMock);

        const element = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(clone(element.getWiredTagDetail())).toEqual(outputMock);
    });

    it('test Basic Cache Hit Scenario- do not fetch tagDetails second time', async () => {
        const outputMock = getDataMock('InterestTagListRepresentation');

        mockGetTagsByRecordIdNetworkOnce(MOCK_TEST_CONFIG, outputMock);

        const el = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredTagDetail())).toEqual(outputMock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredTagDetail())).toEqual(outputMock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const outputMock = getDataMock('InterestTagListRepresentation');

        const mockTestConfig2 = {
            recordId: 'mockId2',
        };

        mockGetTagsByRecordIdNetworkOnce(MOCK_TEST_CONFIG, outputMock);
        mockGetTagsByRecordIdNetworkOnce(mockTestConfig2, outputMock);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el1.getWiredTagDetail()).toEqual(outputMock);

        const el2 = await setupElement(mockTestConfig2, GetTagsByRecordId);
        expect(el2.getWiredTagDetail()).toEqual(outputMock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('test Expired Data Cache Miss Scenario- should hit network if details are available but expired', async () => {
        const outputMock = getDataMock('InterestTagListRepresentation');

        mockGetTagsByRecordIdNetworkSequence(MOCK_TEST_CONFIG, [outputMock, outputMock]);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredTagDetail()).toEqual(outputMock);

        expireGetTagsByRecordId();

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredTagDetail()).toEqual(outputMock);

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
        mockGetTagsByRecordIdNetworkErrorOnce(MOCK_TEST_CONFIG, mock);

        const el = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
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

        mockGetTagsByRecordIdNetworkOnce(MOCK_TEST_CONFIG, {
            reject: true,
            data: mockError,
        });

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el1.getError()).toEqualImmutable(mockError);

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el2.getError()).toEqualImmutable(mockError);
    });

    it('test Expired Server 404 Cache Miss Scenario- should refetch details when ingested properties error TTLs out', async () => {
        const outputMock = getDataMock('InterestTagListRepresentation');

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

        mockGetTagsByRecordIdNetworkSequence(MOCK_TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            outputMock,
        ]);

        const el1 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el1.getError()).toEqualImmutable(mockError);

        clearCache();

        const el2 = await setupElement(MOCK_TEST_CONFIG, GetTagsByRecordId);
        expect(el2.error).toBeUndefined();
        expect(el2.getWiredTagDetail()).toEqual(outputMock);
    });
});
