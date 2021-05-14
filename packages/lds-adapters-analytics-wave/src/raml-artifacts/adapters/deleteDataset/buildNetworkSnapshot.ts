import { Luvio, FetchResponse } from '@luvio/engine';
import {
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    DeleteDatasetConfig,
} from '../../../generated/adapters/deleteDataset';
import { datasetNameToIdCache } from '../../utils/datasetNameToIdCache';

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: DeleteDatasetConfig
): Promise<void | FetchResponse<unknown>> {
    // see if datasetIdOrApiName is in the nameToIdCache
    const id = datasetNameToIdCache.get(config.datasetIdOrApiName);

    // if id is in the nameToIdCache, update config to use id so that luvio cache gets evicted
    let newConfig = id ? { datasetIdOrApiName: id } : config;

    return generatedBuildNetworkSnapshot(luvio, newConfig).then(
        () => {
            // if delete request is successful, remove id-name mapping from nameToIdCache
            datasetNameToIdCache.remove(config.datasetIdOrApiName);
        },
        (response) => {
            throw response;
        }
    );
}
