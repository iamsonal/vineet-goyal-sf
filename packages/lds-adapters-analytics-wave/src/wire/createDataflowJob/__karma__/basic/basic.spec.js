import { createDataflowJob } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateDataflowJobNetworkOnce,
    mockCreateDataflowJobNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/createDataflowJob/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates and starts a dataflow job', async () => {
        const mock = getMock('dataflow-job');
        const config = {
            dataflowJob: { command: 'start', dataflowId: mock.id },
        };
        mockCreateDataflowJobNetworkOnce(config, mock);

        const data = await createDataflowJob(config);

        expect(data.data).toEqual(mock);
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
            dataflowJob: { command: 'start', dataflowId: mock.id },
        };
        mockCreateDataflowJobNetworkErrorOnce(config, mock);

        try {
            await createDataflowJob(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
