import GetDataflowJobNode from '../lwc/get-dataflow-job-node';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobNodeNetworkOnce,
    mockGetDataflowJobNodeNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJobNode/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflow job node', async () => {
        const mock = getMock('dataflow-job-node');
        const jobMock = getMock('dataflow-job');
        const config = {
            dataflowjobId: jobMock.id,
            nodeId: mock.id,
        };
        mockGetDataflowJobNodeNetworkOnce(config, mock);

        const setupConfig = {
            jobId: jobMock.id,
            nodeId: mock.id,
        };
        const el = await setupElement(setupConfig, GetDataflowJobNode);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflow-job-node');
        const jobMock = getMock('dataflow-job');
        const config = {
            dataflowjobId: jobMock.id,
            nodeId: mock.id,
        };
        mockGetDataflowJobNodeNetworkOnce(config, mock);

        const setupConfig = {
            jobId: jobMock.id,
            nodeId: mock.id,
        };
        const el = await setupElement(setupConfig, GetDataflowJobNode);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(setupConfig, GetDataflowJobNode);
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
        const jobId = '03CRM0000006tEf2AI';
        const id = '03LRM000000Bg4P2AS';
        const config = { dataflowjobId: jobId, nodeId: id };
        mockGetDataflowJobNodeNetworkErrorOnce(config, mock);

        const setupConfig = {
            jobId: jobId,
            nodeId: id,
        };
        const el = await setupElement(setupConfig, GetDataflowJobNode);
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

        const jobId = '03CRM0000006tEf2AI';
        const id = '03LRM000000Bg4P2AS';
        const config = { dataflowjobId: jobId, nodeId: id };

        mockGetDataflowJobNodeNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const setupConfig = {
            jobId: jobId,
            nodeId: id,
        };
        const el = await setupElement(setupConfig, GetDataflowJobNode);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(setupConfig, GetDataflowJobNode);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataflow-job-node');
        const jobMock = getMock('dataflow-job');
        const config = {
            dataflowjobId: jobMock.id,
            nodeId: mock.id,
        };
        const setupConfig = {
            jobId: jobMock.id,
            nodeId: mock.id,
        };
        mockGetDataflowJobNodeNetworkOnce(config, mock);

        // populate cache
        await setupElement(setupConfig, GetDataflowJobNode);

        // second component should have the cached data without hitting network
        const element = await setupElement(setupConfig, GetDataflowJobNode);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataflow-job-node');
        const jobMock = getMock('dataflow-job');
        const updatedData = getMock('dataflow-job-node-2');
        const config = {
            dataflowjobId: jobMock.id,
            nodeId: mock.id,
        };
        const setupConfig = {
            jobId: jobMock.id,
            nodeId: mock.id,
        };
        mockGetDataflowJobNodeNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(setupConfig, GetDataflowJobNode);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(setupConfig, GetDataflowJobNode);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
