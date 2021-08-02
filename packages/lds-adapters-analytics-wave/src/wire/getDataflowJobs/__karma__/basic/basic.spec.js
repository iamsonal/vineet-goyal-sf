import timekeeper from 'timekeeper';
import GetDataflowJobs from '../lwc/get-dataflow-jobs';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobsNetworkOnce,
    mockGetDataflowJobsNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJobs/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflow jobs', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets dataflow jobs in running status', async () => {
        const mock = getMock('dataflow-jobs-running');
        const config = { status: 'Running' };
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets no job and then some jobs after TTL expires', async () => {
        const mockEmptyData = {
            dataflowJobs: [],
            url: '/services/data/v53.0/wave/dataflowjobs',
        };
        const mockData = getMock('dataflow-jobs-running');
        const config = { status: 'Running' };

        mockGetDataflowJobsNetworkOnce(config, [mockEmptyData, mockData]);
        const el = await setupElement(config, GetDataflowJobs);
        expect(el.getWiredData()).toEqual(mockEmptyData);

        timekeeper.travel(Date.now() + 5000 + 1);

        const el2 = await setupElement(config, GetDataflowJobs);
        expect(el2.getWiredData()).toEqual(mockData);
    });

    it('gets some jobs and then no job after TTL expires', async () => {
        const mockEmptyData = {
            dataflowJobs: [],
            url: '/services/data/v53.0/wave/dataflowjobs',
        };
        const mockData = getMock('dataflow-jobs-running');
        const config = { status: 'Running' };

        mockGetDataflowJobsNetworkOnce(config, [mockData, mockEmptyData]);
        const el = await setupElement(config, GetDataflowJobs);
        expect(el.getWiredData()).toEqual(mockData);

        timekeeper.travel(Date.now() + 5000 + 1);

        const el2 = await setupElement(config, GetDataflowJobs);
        expect(el2.getWiredData()).toEqual(mockEmptyData);
    });

    it('gets dataflow jobs with jobTypes, startedAfter, startedBefore', async () => {
        const mock = getMock('dataflow-jobs-running');
        const config = {
            jobTypes: ['recipe'],
            startedAfter: '1622752558',
            startedBefore: '1623450350',
        };
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets dataflow jobs with status and search', async () => {
        const mock = getMock('dataflow-jobs-running');
        const config = { status: 'Running', q: 'recipe' };
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets dataflow jobs with licenseType, page, and pageSize', async () => {
        const mock = getMock('dataflow-jobs-page');
        const config = { licenseType: 'Sonic', page: 'eyJwYWdlU2', pageSize: 20 };
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        mockGetDataflowJobsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDataflowJobs);
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
        mockGetDataflowJobsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDataflowJobs);
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
        mockGetDataflowJobsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDataflowJobs);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        mockGetDataflowJobsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetDataflowJobs);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetDataflowJobs);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        const updatedData = getMock('dataflow-jobs-page');
        mockGetDataflowJobsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetDataflowJobs);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetDataflowJobs);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
