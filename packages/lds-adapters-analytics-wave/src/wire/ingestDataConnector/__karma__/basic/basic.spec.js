import { ingestDataConnector } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock } from 'test-util';
import {
    mockIngestDataConnectorNetworkOnce,
    mockIngestDataConnectorNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/ingestDataConnector/__karma__/data/';
const config = {
    connectorIdOrApiName: '0ItS700000001YxKAI',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('trigger data connector ingest', async () => {
        const mock = getMock('ingest-data-connector');
        mockIngestDataConnectorNetworkOnce(config, mock);

        const data = await ingestDataConnector(config);

        expect(data.data).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0ItS700000001YxKAI',
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

        mockIngestDataConnectorNetworkErrorOnce(config, mock);

        try {
            await ingestDataConnector(config);
            // make sure we are hitting the catch
            fail('ingestDataConnector did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
