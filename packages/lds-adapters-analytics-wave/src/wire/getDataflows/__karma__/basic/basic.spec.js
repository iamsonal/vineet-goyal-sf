import timekeeper from 'timekeeper';
import GetDataflows from '../lwc/get-dataflows';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowsNetworkOnce,
    mockGetDataflowsNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflows/__karma__/data/';
const GET_DATAFLOWS_TTL = 5000;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflows', async () => {
        const mock = getMock('dataflows');
        const config = {};
        mockGetDataflowsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflows);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets no dataflow and then some dataflows after TTL expires', async () => {
        const mockEmptyData = {
            dataflows: [],
        };
        const mockData = getMock('dataflows');
        const config = {};

        mockGetDataflowsNetworkOnce(config, [mockEmptyData, mockData]);
        const el = await setupElement(config, GetDataflows);
        expect(el.getWiredData()).toEqual(mockEmptyData);

        timekeeper.travel(Date.now() + GET_DATAFLOWS_TTL + 1);

        const el2 = await setupElement(config, GetDataflows);
        expect(el2.getWiredData()).toEqual(mockData);
    });

    it('gets some dataflows and then no dataflow after TTL expires', async () => {
        const mockEmptyData = {
            dataflows: [],
        };
        const mockData = getMock('dataflows');
        const config = {};

        mockGetDataflowsNetworkOnce(config, [mockData, mockEmptyData]);
        const el = await setupElement(config, GetDataflows);
        expect(el.getWiredData()).toEqual(mockData);

        timekeeper.travel(Date.now() + GET_DATAFLOWS_TTL + 1);

        const el2 = await setupElement(config, GetDataflows);
        expect(el2.getWiredData()).toEqual(mockEmptyData);
    });

    it('gets dataflows with search', async () => {
        const mock = getMock('dataflows-search');
        const config = { q: 'Test' };
        mockGetDataflowsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflows);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflows');
        const config = {};
        mockGetDataflowsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflows);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataflows);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
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
        const config = {};
        mockGetDataflowsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataflows);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
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
        const config = {};
        mockGetDataflowsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataflows);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataflows);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataflows');
        const config = {};
        mockGetDataflowsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDataflows);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDataflows);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataflows');
        const config = {};
        const updatedData = getMock('dataflows');
        mockGetDataflowsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDataflows);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDataflows);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
