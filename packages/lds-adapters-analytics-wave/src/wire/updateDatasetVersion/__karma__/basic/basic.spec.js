import { updateDatasetVersion } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateDatasetVersionNetworkOnce,
    mockUpdateDatasetVersionNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetDatasetVersion from '../../../getDatasetVersion/__karma__/lwc/get-dataset-version';

const MOCK_PREFIX = 'wire/updateDatasetVersion/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update dataset version', async () => {
        const mock = getMock('dataset-version');
        const config = {
            datasetIdOrApiName: mock.dataset.id,
            versionId: mock.id,
            datasetVersion: {
                isComplete: true,
                totalRowCount: 799,
            },
        };
        mockUpdateDatasetVersionNetworkOnce(config, mock);
        const data = await updateDatasetVersion(config);
        expect(data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated dataset version', async () => {
        const mock = getMock('dataset-version');
        const config = {
            datasetIdOrApiName: mock.dataset.id,
            versionId: mock.id,
            datasetVersion: {
                isComplete: true,
                totalRowCount: 799,
            },
        };
        mockUpdateDatasetVersionNetworkOnce(config, mock);
        await updateDatasetVersion(config);
        const element = await setupElement(
            { idOfDataset: config.datasetIdOrApiName, versionId: config.versionId },
            GetDatasetVersion
        );
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqual(mock);
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
            datasetIdOrApiName: 'datasetIdOrApiName',
            versionId: 'versionId',
            datasetVersion: {
                isComplete: true,
                totalRowCount: 799,
            },
        };
        mockUpdateDatasetVersionNetworkErrorOnce(config, mock);
        try {
            await updateDatasetVersion(config);
            fail('updateDatasetVersion did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
            expect(e).toBeImmutable();
        }
    });
});
