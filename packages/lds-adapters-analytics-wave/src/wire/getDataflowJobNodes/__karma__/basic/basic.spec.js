import GetDataflowJobNodes from '../lwc/get-dataflow-job-nodes';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobNodesNetworkOnce,
    mockGetDataflowJobNodesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJobNodes/__karma__/data/';

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
            jobId: '03CRM0000006tEf2AI',
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
        const config = { dataflowjobId: mock.jobId };
        mockGetDataflowJobNodesNetworkErrorOnce(config, mock);

        const el = await setupElement({ jobId: mock.jobId }, GetDataflowJobNodes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            jobId: '03CRM0000006tEf2AI',
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
        const config = { dataflowjobId: mock.jobId };
        mockGetDataflowJobNodesNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement({ jobId: mock.jobId }, GetDataflowJobNodes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ jobId: mock.jobId }, GetDataflowJobNodes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
