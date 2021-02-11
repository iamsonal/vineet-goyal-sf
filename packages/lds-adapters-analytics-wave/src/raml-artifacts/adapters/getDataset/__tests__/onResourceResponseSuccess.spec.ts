import { Environment, HttpStatusCode, Luvio, ResourceResponse, Store } from '@luvio/engine';
import { onResourceResponseSuccess as generatedOnResourceResponseSuccess } from '../../../../generated/adapters/getDataset';
import { DatasetRepresentation } from '../../../../generated/types/DatasetRepresentation';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';
import { onResourceResponseSuccess } from '../onResourceResponseSuccess';

jest.mock('../../../../generated/adapters/getDataset', () => {
    return {
        onResourceResponseSuccess: jest.fn(),
    };
});

describe('onResourceResponseSuccess', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    const mockDataset: DatasetRepresentation = {
        id: '0Fbxx0000004Cx3CAE',
        name: 'Foo',
        datasetType: 'Default',
        folder: {
            id: '00lxx000000j9TBAAY',
        },
        versionsUrl: '',
        visibility: 'All',
        url: '',
        type: 'Dataset',
    };

    const mockResponse: ResourceResponse<DatasetRepresentation> = {
        status: HttpStatusCode.Ok,
        statusText: 'Ok',
        ok: true,
        headers: {},
        body: mockDataset,
    };

    it('caches name when fetched by id', () => {
        const config = { datasetIdOrApiName: mockDataset.id };
        const resourceParams = { urlParams: { datasetIdOrApiName: mockDataset.id } };
        onResourceResponseSuccess(luvio, config, resourceParams, mockResponse);

        expect(datasetNameToIdCache.get(mockDataset.name)).toEqual(mockDataset.id);
        expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
        expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
            luvio,
            config,
            resourceParams,
            mockResponse
        );
    });

    it('caches id when fetched by name', () => {
        const config = { datasetIdOrApiName: mockDataset.name };
        onResourceResponseSuccess(
            luvio,
            config,
            { urlParams: { datasetIdOrApiName: mockDataset.name } },
            mockResponse
        );

        expect(datasetNameToIdCache.get(mockDataset.name)).toEqual(mockDataset.id);
        expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
        expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
            luvio,
            config,
            { urlParams: { datasetIdOrApiName: mockDataset.id } },
            mockResponse
        );
    });
});
