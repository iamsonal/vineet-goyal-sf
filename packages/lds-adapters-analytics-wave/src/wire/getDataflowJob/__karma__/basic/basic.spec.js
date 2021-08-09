import GetDataflowJob from '../lwc/get-dataflow-job';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataflowJobNetworkOnce,
    mockGetDataflowJobNetworkErrorOnce,
    expireAsset,
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
        const id = '0ePRM0000000WC52AM';
        const config = { dataflowjobId: id };
        mockGetDataflowJobNetworkErrorOnce(config, mock);

        const el = await setupElement({ jobId: id }, GetDataflowJob);
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
        const id = '0ePRM0000000WC52AM';
        const config = { dataflowjobId: id };

        mockGetDataflowJobNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement({ jobId: id }, GetDataflowJob);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement({ jobId: id }, GetDataflowJob);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('dataflow-job');
        const config = { dataflowjobId: mock.id };
        mockGetDataflowJobNetworkOnce(config, mock);

        // populate cache
        await setupElement({ jobId: mock.id }, GetDataflowJob);

        // second component should have the cached data without hitting network
        const element = await setupElement({ jobId: mock.id }, GetDataflowJob);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('dataflow-job');
        const config = { dataflowjobId: mock.id };
        const updatedData = getMock('dataflow-job-2');
        mockGetDataflowJobNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement({ jobId: mock.id }, GetDataflowJob);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement({ jobId: mock.id }, GetDataflowJob);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
