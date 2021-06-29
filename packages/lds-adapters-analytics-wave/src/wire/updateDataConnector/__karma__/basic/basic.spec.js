import { updateDataConnector } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateDataConnectorNetworkOnce,
    mockUpdateDataConnectorNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetDataConnector from '../../../getDataConnector/__karma__/lwc/get-data-connector';

const MOCK_PREFIX = 'wire/updateDataConnector/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update label and description of data connector', async () => {
        const mock = getMock('data-connector');
        const config = {
            connectorIdOrApiName: mock.id,
            dataConnector: {
                label: 'My Salesforce External Connector',
                description: 'Snowflake connector',
                connectionProperties: [
                    {
                        name: 'account',
                        value: 'ib89151',
                    },
                ],
            },
        };
        mockUpdateDataConnectorNetworkOnce(config, mock);

        const data = await updateDataConnector(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated data connector', async () => {
        const mock = getMock('data-connector');
        const config = {
            connectorIdOrApiName: mock.id,
            dataConnector: {
                label: 'My Salesforce External Connector',
                description: 'Snowflake connector',
                connectionProperties: [
                    {
                        name: 'account',
                        value: 'ib89151',
                    },
                ],
            },
        };
        mockUpdateDataConnectorNetworkOnce(config, mock);

        const data = await updateDataConnector(config);

        const element = await setupElement({ connectorIdOrApiName: data.id }, GetDataConnector);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0ItS70000004CVSKA2',
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
            connectorIdOrApiName: mock.id,
            dataConnector: {
                label: 'My Salesforce External Connector',
                description: 'Snowflake connector',
                connectionProperties: [
                    {
                        name: 'account',
                        value: 'ib89151',
                    },
                ],
            },
        };
        mockUpdateDataConnectorNetworkErrorOnce(config, mock);

        try {
            await updateDataConnector(config);
            // make sure we are hitting the catch
            fail('updateDataConnector did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
