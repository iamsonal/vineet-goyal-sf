import { createDatasetVersion } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateDatasetVersionNetworkOnce,
    mockCreateDatasetVersionNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/createDatasetVersion/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('restores to a dataset version', async () => {
        const mock = getMock('restore-dataset-version');
        const config = {
            datasetIdOrApiName: '0Fbxx0000004CKKCA2',
            sourceVersion: {
                id: '0Fcxx0000004C92CAE',
            },
        };
        mockCreateDatasetVersionNetworkOnce(config, mock);

        const data = await createDatasetVersion(config);

        expect(data).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = getMock('error');
        const config = {
            datasetIdOrApiName: '0Fbxx0000004CKKCA2',
            sourceVersion: {
                id: '0Fcxx0000004C92CAE',
            },
        };
        mockCreateDatasetVersionNetworkErrorOnce(config, mock);

        try {
            await createDatasetVersion(config);
            // make sure we are hitting the catch
            fail('createDatasetVersion did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });
});
