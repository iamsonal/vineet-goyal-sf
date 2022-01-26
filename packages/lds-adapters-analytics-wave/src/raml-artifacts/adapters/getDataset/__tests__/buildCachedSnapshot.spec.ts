import { Environment, Luvio, Snapshot, Store } from '@luvio/engine';
import { DatasetRepresentation } from '../../../../generated/types/DatasetRepresentation';
import { buildCachedSnapshotCachePolicy as generatedBuildCachedSnapshotCachePolicy } from '../../../../generated/adapters/getDataset';
import { GetDatasetConfig } from '../../../../generated/adapters/getDataset';
import { buildCachedSnapshotCachePolicy } from '../buildCachedSnapshotCachePolicy';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';

jest.mock('../../../../generated/adapters/getDataset', () => {
    return {
        buildCachedSnapshotCachePolicy: jest
            .fn()
            .mockReturnValue({} as Snapshot<DatasetRepresentation>),
    };
});

describe('buildCachedSnapshotCachePolicy', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    it('calls generated method once on empty nameToIdCache', () => {
        const config: GetDatasetConfig = { datasetIdOrApiName: 'Foo' };
        buildCachedSnapshotCachePolicy({ luvio, config }, luvio.storeLookup);

        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenLastCalledWith(
            { luvio, config },
            luvio.storeLookup
        );
    });

    it('calls generated method once on nameToIdCache match with snapshot data', () => {
        const datasetName = 'Foo';
        const datasetId = '0Fbxx0000004Cx3CAE';
        datasetNameToIdCache.set(datasetName, datasetId);
        buildCachedSnapshotCachePolicy(
            { luvio, config: { datasetIdOrApiName: datasetName } },
            luvio.storeLookup
        );

        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenLastCalledWith(
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
