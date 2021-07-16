import { updateReplicatedFields } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateReplicatedFieldsNetworkOnce,
    mockUpdateReplicatedFieldsNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetReplicatedFields from '../../../getReplicatedFields/__karma__/lwc/get-replicated-fields';

const MOCK_PREFIX = 'wire/updateReplicatedFields/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update replicated fields', async () => {
        const mock = getMock('replicated-fields');
        const replicatedDatasetMock = getMock('replicated-dataset');
        const config = {
            id: replicatedDatasetMock.id,
            replicatedFields: {
                fields: [
                    { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                    { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                ],
            },
        };
        mockUpdateReplicatedFieldsNetworkOnce(config, mock);

        const data = await updateReplicatedFields(config);

        expect(data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated replicated fields', async () => {
        const mock = getMock('replicated-fields');
        const replicatedDatasetMock = getMock('replicated-dataset');
        const config = {
            id: replicatedDatasetMock.id,
            replicatedFields: {
                fields: [
                    { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                    { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                ],
            },
        };
        mockUpdateReplicatedFieldsNetworkOnce(config, mock);

        const data = await updateReplicatedFields(config);

        const element = await setupElement(
            { replicatedDatasetId: data.replicatedDataset.id },
            GetReplicatedFields
        );

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
            replicatedFields: {
                fields: [
                    { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                    { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                ],
            },
        };
        mockUpdateReplicatedFieldsNetworkErrorOnce(config, mock);

        try {
            await updateReplicatedFields(config);
            // make sure we are hitting the catch
            fail('updateReplicatedFields did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
