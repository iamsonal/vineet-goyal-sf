import timekeeper from 'timekeeper';
import GetDataflowJobNodes from '../lwc/get-dataflow-job-nodes';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobNodesNetworkOnce,
    mockGetDataflowJobNodesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJobNodes/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflow job nodes', async () => {
        const mock = getMock('dataflow-job-nodes');
        const jobMock = getMock('dataflow-job');
        const config = { dataflowjobId: jobMock.id };
        mockGetDataflowJobNodesNetworkOnce(config, mock);

        const el = await setupElement({ jobId: jobMock.id }, GetDataflowJobNodes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflow-job-nodes');
        const jobMock = getMock('dataflow-job');
        const config = { dataflowjobId: jobMock.id };
        mockGetDataflowJobNodesNetworkOnce(config, mock);

        const el = await setupElement({ jobId: jobMock.id }, GetDataflowJobNodes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ jobId: jobMock.id }, GetDataflowJobNodes);
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
        const id = '03CRM0000006tEf2AI';
        const config = { dataflowjobId: id };
        mockGetDataflowJobNodesNetworkErrorOnce(config, mock);

        const el = await setupElement({ jobId: id }, GetDataflowJobNodes);
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
        const id = '03CRM0000006tEf2AI';
        const config = { dataflowjobId: id };
        mockGetDataflowJobNodesNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement({ jobId: id }, GetDataflowJobNodes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ jobId: id }, GetDataflowJobNodes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataflow-job-nodes');
        const jobMock = getMock('dataflow-job');
        const config = { dataflowjobId: jobMock.id };
        const setupConfig = { jobId: jobMock.id };
        mockGetDataflowJobNodesNetworkOnce(config, mock);

        // populate cache
        await setupElement(setupConfig, GetDataflowJobNodes);

        // second component should have the cached data without hitting network
        const element = await setupElement(setupConfig, GetDataflowJobNodes);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataflow-job-nodes');
        const jobMock = getMock('dataflow-job');
        const updatedData = getMock('dataflow-job-nodes-2');
        const config = { dataflowjobId: jobMock.id };
        const setupConfig = { jobId: jobMock.id };

        mockGetDataflowJobNodesNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(setupConfig, GetDataflowJobNodes);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(setupConfig, GetDataflowJobNodes);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
