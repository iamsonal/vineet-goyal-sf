import { createDataConnector } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateDataConnectorNetworkOnce,
    mockCreateDataConnectorNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/createDataConnector/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates a data connector', async () => {
        const mock = getMock('connector');
        const config = {
            dataConnector: {
                connectorType: 'SfdcLocal',
                connectionProperties: [],
                connectorHandler: 'Legacy',
                label: 'sfdc 2',
                name: 'sfdc2',
                description: 'second sfdc connector',
            },
        };
        mockCreateDataConnectorNetworkOnce(config, mock);

        const data = await createDataConnector(config);

        expect(data).toEqualWithExtraNestedData(mock);
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
            dataConnector: {
                connectorType: 'SfdcLocal',
                connectionProperties: [],
                connectorHandler: 'Legacy',
                label: 'sfdc 2',
                name: 'sfdc2',
                description: 'second sfdc connector',
            },
        };
        mockCreateDataConnectorNetworkErrorOnce(config, mock);

        try {
            await createDataConnector(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
