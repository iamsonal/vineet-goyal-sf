import { Environment, Luvio, Snapshot, Store } from '@luvio/engine';
import { DatasetRepresentation } from '../../../../generated/types/DatasetRepresentation';
import { buildInMemorySnapshotCachePolicy as generatedBuildInMemorySnapshotCachePolicy } from '../../../../generated/adapters/getDataset';
import { GetDatasetConfig } from '../../../../generated/adapters/getDataset';
import { buildInMemorySnapshotCachePolicy } from '../buildInMemorySnapshotCachePolicy';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';

jest.mock('../../../../generated/adapters/getDataset', () => {
    return {
        buildInMemorySnapshotCachePolicy: jest
            .fn()
            .mockReturnValue({} as Snapshot<DatasetRepresentation>),
    };
});

describe('buildInMemorySnapshotCachePolicy', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    it('calls generated method once on empty nameToIdCache', () => {
        const config: GetDatasetConfig = { datasetIdOrApiName: 'Foo' };
        buildInMemorySnapshotCachePolicy({ luvio, config }, luvio.storeLookup);

        expect(generatedBuildInMemorySnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildInMemorySnapshotCachePolicy).toHaveBeenLastCalledWith(
            { luvio, config },
            luvio.storeLookup
        );
    });

    it('calls generated method once on nameToIdCache match with snapshot data', () => {
        const datasetName = 'Foo';
        const datasetId = '0Fbxx0000004Cx3CAE';
        datasetNameToIdCache.set(datasetName, datasetId);
        buildInMemorySnapshotCachePolicy(
            { luvio, config: { datasetIdOrApiName: datasetName } },
            luvio.storeLookup
        );

        expect(generatedBuildInMemorySnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildInMemorySnapshotCachePolicy).toHaveBeenLastCalledWith(
            {
                luvio,
                config: {
                    datasetIdOrApiName: datasetId,
                },
            },
            luvio.storeLookup
        );
    });
});
