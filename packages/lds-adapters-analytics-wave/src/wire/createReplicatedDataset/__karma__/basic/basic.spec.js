import { createReplicatedDataset } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockCreateReplicatedDatasetNetworkOnce,
    mockCreateReplicatedDatasetNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetReplicatedDataset from '../../../getReplicatedDataset/__karma__/lwc/get-replicated-dataset';

const MOCK_PREFIX = 'wire/createReplicatedDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates a replicated dataset', async () => {
        const mock = getMock('replicated-dataset');
        const config = {
            replicatedDataset: {
                connectorId: '0ItS700000001YxKAI',
                sourceObjectName: 'Account',
            },
        };
        mockCreateReplicatedDatasetNetworkOnce(config, mock);

        const data = await createReplicatedDataset(config);

        expect(data.data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly created replicated dataset', async () => {
        const mock = getMock('replicated-dataset');
        const config = {
            replicatedDataset: {
                connectorId: '0ItS700000001YxKAI',
                sourceObjectName: 'Account',
            },
        };
        mockCreateReplicatedDatasetNetworkOnce(config, mock);

        const data = await createReplicatedDataset(config);

        const element = await setupElement(
            { replicatedDatasetId: data.data.id },
            GetReplicatedDataset
        );

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0ItS7000000xxxxxxx',
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: '269',
                    message: "Can't find connector by ID 0ItS7000000xxxxxxx",
                },
            ],
        };
        const config = {
            replicatedDataset: {
                connectorId: 'start',
                sourceObjectName: '0ItS7000000xxxxxxx',
            },
        };
        mockCreateReplicatedDatasetNetworkErrorOnce(config, mock);

        try {
            await createReplicatedDataset(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
