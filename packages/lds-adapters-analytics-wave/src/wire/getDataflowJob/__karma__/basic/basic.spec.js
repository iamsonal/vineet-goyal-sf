import GetDataflowJob from '../lwc/get-dataflow-job';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobNetworkOnce,
    mockGetDataflowJobNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDataflowJob/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets dataflow job', async () => {
        const mock = getMock('dataflow-job');
        const config = { dataflowjobId: mock.id };
        mockGetDataflowJobNetworkOnce(config, mock);

        const el = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('dataflow-job');
        const config = { dataflowjobId: mock.id };
        mockGetDataflowJobNetworkOnce(config, mock);

        const el = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0ePRM0000000WC52AM',
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
        const config = { dataflowjobId: mock.id };
        mockGetDataflowJobNetworkErrorOnce(config, mock);

        const el = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            id: '0ePRM0000000WC52AM',
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
        const config = { dataflowjobId: mock.id };

        mockGetDataflowJobNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement({ jobId: mock.id }, GetDataflowJob);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
