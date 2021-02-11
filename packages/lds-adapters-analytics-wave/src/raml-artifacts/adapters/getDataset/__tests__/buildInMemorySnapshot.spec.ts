import { Environment, Luvio, Snapshot, Store } from '@luvio/engine';
import { DatasetRepresentation } from '../../../../generated/types/DatasetRepresentation';
import { buildInMemorySnapshot as generatedBuildInMemorySnapshot } from '../../../../generated/adapters/getDataset';
import { GetDatasetConfig } from '../../../../generated/adapters/getDataset';
import { buildInMemorySnapshot } from '../buildInMemorySnapshot';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';

jest.mock('../../../../generated/adapters/getDataset', () => {
    return {
        buildInMemorySnapshot: jest.fn().mockReturnValue({} as Snapshot<DatasetRepresentation>),
    };
});

describe('buildInMemorySnapshot', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    it('calls generated method once on empty nameToIdCache', () => {
        const config: GetDatasetConfig = { datasetIdOrApiName: 'Foo' };
        buildInMemorySnapshot(luvio, config);

        expect(generatedBuildInMemorySnapshot).toHaveBeenCalledTimes(1);
        expect(generatedBuildInMemorySnapshot).toHaveBeenLastCalledWith(luvio, config);
    });

    it('calls generated method once on nameToIdCache match with snapshot data', () => {
        const datasetName = 'Foo';
        const datasetId = '0Fbxx0000004Cx3CAE';
        datasetNameToIdCache.set(datasetName, datasetId);
        buildInMemorySnapshot(luvio, { datasetIdOrApiName: datasetName });

        expect(generatedBuildInMemorySnapshot).toHaveBeenCalledTimes(1);
        expect(generatedBuildInMemorySnapshot).toHaveBeenLastCalledWith(luvio, {
            datasetIdOrApiName: datasetId,
        });
    });
});
