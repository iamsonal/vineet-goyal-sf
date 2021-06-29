import { updateReplicatedDataset } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateReplicatedDatasetNetworkOnce,
    mockUpdateReplicatedDatasetNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetReplicatedDataset from '../../../getReplicatedDataset/__karma__/lwc/get-replicated-dataset';

const MOCK_PREFIX = 'wire/updateReplicatedDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update replicated dataset connection mode to Full', async () => {
        const mock = getMock('replicated-dataset');
        const config = {
            id: mock.id,
            replicatedDataset: {
                connectionMode: 'Full',
            },
        };
        mockUpdateReplicatedDatasetNetworkOnce(config, mock);

        const data = await updateReplicatedDataset(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated replicated dataset', async () => {
        const mock = getMock('replicated-dataset');
        const config = {
            id: mock.id,
            replicatedDataset: {
                connectionMode: 'Full',
            },
        };
        mockUpdateReplicatedDatasetNetworkOnce(config, mock);

        const data = await updateReplicatedDataset(config);

        const element = await setupElement({ replicatedDatasetId: data.id }, GetReplicatedDataset);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0IuS70000004CqIKAU',
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
            id: mock.id,
            replicatedDataset: {
                connectionMode: 'Full',
            },
        };
        mockUpdateReplicatedDatasetNetworkErrorOnce(config, mock);

        try {
            await updateReplicatedDataset(config);
            // make sure we are hitting the catch
            fail('updateReplicatedDataset did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
