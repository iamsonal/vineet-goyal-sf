import { Luvio, Snapshot, StoreLookup } from '@luvio/engine';
import {
    buildInMemorySnapshotCachePolicy as generatedBuildInMemorySnapshotCachePolicy,
    GetDatasetConfig,
} from '../../../generated/adapters/getDataset';
import { DatasetRepresentation } from '../../../generated/types/DatasetRepresentation';
import { datasetNameToIdCache } from '../../utils/datasetNameToIdCache';

export function buildInMemorySnapshotCachePolicy(
    context: { luvio: Luvio; config: GetDatasetConfig },
    storeLookup: StoreLookup<DatasetRepresentation>
): Snapshot<DatasetRepresentation> {
    const { config, luvio } = context;
    // see if datasetIdOrApiName is a name for which we have the id and, if so, return that snapshot
    const id = datasetNameToIdCache.get(config.datasetIdOrApiName);
    if (id && id !== config.datasetIdOrApiName) {
        return generatedBuildInMemorySnapshotCachePolicy(
            { luvio, config: { datasetIdOrApiName: id } },
            storeLookup
        );
    }
    // otherwise, check it as normal against the id snapshots
    return generatedBuildInMemorySnapshotCachePolicy(context, storeLookup);
}
