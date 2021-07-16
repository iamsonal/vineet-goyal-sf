import UpdateDataflowJob from '../lwc/update-dataflow-job';
import {
    getMock as globalGetMock,
    setupElement,
    flushPromises,
    assertNetworkCallCount,
} from 'test-util';
import {
    mockUpdateDataflowJobNetworkOnce,
    mockUpdateDataflowJobNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/updateDataflowJob/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('stops a dataflow job', async () => {
        const mock = getMock('dataflow-job');
        const config = {
            dataflowjobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        mockUpdateDataflowJobNetworkOnce(config, mock);

        const setupConfig = {
            jobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        const el = await setupElement(setupConfig, UpdateDataflowJob);
        el.invokeUpdateDataflowJob(config);
        await flushPromises();
        expect(el.getData()).toEqual(mock);
    });

    it('getDataflowJob after updateDataflowJob does not fetch', async () => {
        const mock = getMock('dataflow-job');
        const config = {
            dataflowjobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        mockUpdateDataflowJobNetworkOnce(config, mock);

        const setupConfig = {
            jobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        const el = await setupElement(setupConfig, UpdateDataflowJob);
        el.invokeUpdateDataflowJob(config);
        await flushPromises();

        expect(el.getData()).toBeDefined();
        expect(el.getData()).toEqual(el.getWiredData().data);
        assertNetworkCallCount();
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
        const config = {
            dataflowjobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        mockUpdateDataflowJobNetworkErrorOnce(config, mock);

        const setupConfig = {
            jobId: mock.id,
            dataflowJob: { command: 'stop' },
        };
        const el = await setupElement(setupConfig, UpdateDataflowJob);
        el.invokeUpdateDataflowJob(config);
        await flushPromises();
        expect(el.getError()).toEqual(mock);
    });
});
