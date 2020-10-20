import GetDataflowJobs from '../lwc/get-dataflow-jobs';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobsNetworkOnce,
    mockGetDataflowJobsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJobs/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflow jobs', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        mockGetDataflowJobsNetworkOnce(mock);

        const el = await setupElement(config, GetDataflowJobs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflow-jobs');
        const config = {};
        mockGetDataflowJobsNetworkOnce(mock);

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
        mockGetDataflowJobsNetworkErrorOnce(mock);

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
        mockGetDataflowJobsNetworkOnce([
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