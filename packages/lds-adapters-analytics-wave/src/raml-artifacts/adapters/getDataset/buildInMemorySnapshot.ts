import { Luvio, Snapshot } from '@luvio/engine';
import {
    buildInMemorySnapshot as generatedBuildInMemorySnapshot,
    GetDatasetConfig,
} from '../../../generated/adapters/getDataset';
import { DatasetRepresentation } from '../../../generated/types/DatasetRepresentation';
import { datasetNameToIdCache } from '../../utils/datasetNameToIdCache';

export function buildInMemorySnapshot(
    luvio: Luvio,
    config: GetDatasetConfig
): Snapshot<DatasetRepresentation> {
    // see if datasetIdOrApiName is a name for which we have the id and, if so, return that snapshot
    const id = datasetNameToIdCache.get(config.datasetIdOrApiName);
    if (id && id !== config.datasetIdOrApiName) {
        return generatedBuildInMemorySnapshot(luvio, { datasetIdOrApiName: id });
    }
    // otherwise, check it as normal against the id snapshots
    return generatedBuildInMemorySnapshot(luvio, config);
}
