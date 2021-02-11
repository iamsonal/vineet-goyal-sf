import { Environment, FetchResponse, HttpStatusCode, Luvio, Store } from '@luvio/engine';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../../generated/adapters/getDataset';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';
import { onResourceResponseError } from '../onResourceResponseError';

jest.mock('../../../../generated/adapters/getDataset', () => {
    return {
        onResourceResponseError: jest.fn(),
    };
});

describe('onResourceResponseError', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    const mockResponse: FetchResponse<unknown> = {
        status: HttpStatusCode.NotFound,
        statusText: 'Not Found',
        ok: false,
        headers: {},
        body: undefined,
    };

    it('clears name from cache', () => {
        const datasetId = '0Fbxx0000004Cx3CAE';
        const datasetName = 'Foo';
        datasetNameToIdCache.set(datasetName, datasetId);

        onResourceResponseError(
            luvio,
            { datasetIdOrApiName: datasetName },
            { urlParams: { datasetIdOrApiName: datasetName } },
            mockResponse
        );

        expect(datasetNameToIdCache.get(datasetName)).toBeUndefined();
        expect(generatedOnResourceResponseError).toHaveBeenCalled();
    });

    it('clears id from cache', () => {
        const datasetId = '0Fbxx0000004Cx3CAE';
        const datasetName = 'Foo';
        datasetNameToIdCache.set(datasetName, datasetId);

        onResourceResponseError(
            luvio,
            { datasetIdOrApiName: datasetId },
            { urlParams: { datasetIdOrApiName: datasetId } },
            mockResponse
        );

        expect(datasetNameToIdCache.get(datasetName)).toBeUndefined();
        expect(generatedOnResourceResponseError).toHaveBeenCalled();
    });
});
