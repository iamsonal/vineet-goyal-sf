import {
    clone,
    mockGetTimelineDataNetworkOnce,
    mockGetTimelineDataNetworkErrorOnce,
    mockGetTimelineDataNetworkSequence,
    expireGetTimelineData,
} from 'industries-timeline-test-util';
import { getMock as globalGetMock, setupElement, clearCache } from 'test-util';
import GetTimelineData from '../lwc/get-timeline-data';

const MOCK_PREFIX = 'wire/getTimelineData/__karma__/data/';
const MOCK_TIMELINE_DATA_JSON = 'TimelineEventsResponse';
const MOCK_TIMELINE_DATA_EMPTY_JSON = 'TimelineEventsEmptyResponse';

const MOCK_TIMELINE_CONFIG_FULL_NAME = 'HealthTimeline';
const MOCK_TIMELINE_OBJECT_RECORD_ID = '0DMR00000000gKcOAI';

const MOCK_TEST_CONFIG = {
    timelineConfigFullName: MOCK_TIMELINE_CONFIG_FULL_NAME,
    timelineObjRecordId: MOCK_TIMELINE_OBJECT_RECORD_ID,
    queryParams: {
        direction: 'prev',
        endDate: '2025-10-08T01:02:03Z',
        eventTypeOffsets: '5',
        eventTypes: 'Case',
        startDate: '2021-10-08T01:02:03Z',
    },
};

const WIRE_CONFIG = {
    timelineConfigFullName: MOCK_TIMELINE_CONFIG_FULL_NAME,
    timelineObjRecordId: MOCK_TIMELINE_OBJECT_RECORD_ID,
    ...MOCK_TEST_CONFIG.queryParams,
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test Basic Cache Miss Scenario- timeline data using getTimelineData', async () => {
        const mock = getMock(MOCK_TIMELINE_DATA_JSON);

        mockGetTimelineDataNetworkOnce(MOCK_TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(clone(el.getWiredRecordDetail())).toEqual(mock);
        expect(el.pushCount).toBe(1);
    });

    it('test Basic Cache Hit Scenario- do not fetch recordDetails second time', async () => {
        const mock = getMock(MOCK_TIMELINE_DATA_JSON);

        // Mock network request once only
        mockGetTimelineDataNetworkOnce(MOCK_TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el.pushCount).toBe(1);
        expect(clone(el.getWiredRecordDetail())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el2.pushCount).toBe(1);
        expect(clone(el2.getWiredRecordDetail())).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock(MOCK_TIMELINE_DATA_JSON);

        const config2 = {
            timelineConfigFullName: 'LoanTimeline',
            timelineObjRecordId: '0DMR00000000DAIOAI',
            queryParams: {
                direction: 'next',
                endDate: '2030-10-08T01:02:03Z',
                eventTypeOffsets: '10',
                eventTypes: 'Task',
                startDate: '2011-10-08T01:02:03Z',
            },
        };

        mockGetTimelineDataNetworkOnce(MOCK_TEST_CONFIG, mock);

        mockGetTimelineDataNetworkOnce(config2, mock);
        const wireConfig2 = {
            timelineConfigFullName: config2.timelineConfigFullName,
            timelineObjRecordId: config2.timelineObjRecordId,
            ...config2.queryParams,
        };

        const el1 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(clone(el1.getWiredRecordDetail())).toEqual(mock);

        const el2 = await setupElement(wireConfig2, GetTimelineData);
        expect(clone(el2.getWiredRecordDetail())).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount).toBe(1);
        expect(el2.pushCount).toBe(1);
    });

    it('test Server 404 Emits Correctly to Component- displays error when network request 404s', async () => {
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

        mockGetTimelineDataNetworkErrorOnce(MOCK_TEST_CONFIG, mockError);

        const el = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el.pushCount).toBe(1);
        expect(el.getError()).toEqual(mockError);
    });

    it('causes a cache hit when a timeline data is queried after server returned 404', async () => {
        const mockError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        mockGetTimelineDataNetworkOnce(MOCK_TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('fetches timeline data successfully with no items', async () => {
        const mock = getMock(MOCK_TIMELINE_DATA_EMPTY_JSON);

        mockGetTimelineDataNetworkOnce(MOCK_TEST_CONFIG, mock);

        const el = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el.pushCount).toBe(1);
        expect(clone(el.getWiredRecordDetail())).toEqual(mock);
    });

    it('expired Server 404 Cache Miss Scenario- should refetch details when ingested properties error TTLs out', async () => {
        const outputMock = getMock(MOCK_TIMELINE_DATA_JSON);

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

        mockGetTimelineDataNetworkSequence(MOCK_TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            outputMock,
        ]);

        const el1 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el1.getError()).toEqualImmutable(mockError);

        clearCache();

        const el2 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el2.error).toBeUndefined();
        expect(el2.getWiredRecordDetail()).toEqual(outputMock);
    });

    it('test Expired Data Cache Miss Scenario- should hit network if details are available but expired', async () => {
        const outputMock = getMock(MOCK_TIMELINE_DATA_JSON);

        mockGetTimelineDataNetworkSequence(MOCK_TEST_CONFIG, [outputMock, outputMock]);

        const el1 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el1.pushCount).toBe(1);
        expect(el1.getWiredRecordDetail()).toEqual(outputMock);

        expireGetTimelineData();

        const el2 = await setupElement(WIRE_CONFIG, GetTimelineData);
        expect(el1.pushCount).toBe(1);
        expect(el2.getWiredRecordDetail()).toEqual(outputMock);

        //el1 should not have received new value
        expect(el1.pushCount).toBe(1);
    });
});
