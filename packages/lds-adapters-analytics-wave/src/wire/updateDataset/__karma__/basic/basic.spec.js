import { updateDataset } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateDatasetNetworkOnce,
    mockUpdateDatasetNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetDataset from '../../../getDataset/__karma__/lwc/get-dataset';

const MOCK_PREFIX = 'wire/updateDataset/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update dataset name and label', async () => {
        const mock = getMock('dataset');
        const config = {
            datasetIdOrApiName: mock.id,
            dataset: {
                label: 'DTC_Opportunity_SAMPLE',
            },
        };
        mockUpdateDatasetNetworkOnce(config, mock);
        const data = await updateDataset(config);
        expect(data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated dataset', async () => {
        const mock = getMock('dataset2');
        const config = {
            datasetIdOrApiName: mock.id,
            dataset: {
                label: 'DTC_Opportunity_SAMPLE2',
            },
        };
        mockUpdateDatasetNetworkOnce(config, mock);
        const data = await updateDataset(config);
        const element = await setupElement({ idOrApiName: data.id }, GetDataset);
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
            datasetIdOrApiName: '05vxx0000004KzQAAU',
            dataset: {
                label: 'DTC_Opportunity_SAMPLE',
            },
        };
        mockUpdateDatasetNetworkErrorOnce(config, mock);

        try {
            await updateDataset(config);
            // make sure we are hitting the catch
            fail('updateDataset did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
            expect(e).toBeImmutable();
        }
    });
});
