import { createConnection } from 'lds-adapters-analytics-data-service';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateConnectionNetworkOnce,
    mockCreateConnectionNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/createConnection/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates a connection', async () => {
        const mock = getMock('connection');
        const config = {
            connection: {
                connectorId: 'SALESFORCE_ADS',
                name: 'sfdc2',
            },
        };
        mockCreateConnectionNetworkOnce(config, mock);

        const data = await createConnection(config);

        expect(data).toEqual(mock);
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
        const config = {
            connection: {
                connectorId: 'SALESFORCE_ADS',
                name: 'sfdc2',
            },
        };
        mockCreateConnectionNetworkErrorOnce(config, mock);

        try {
            await createConnection(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });
});
