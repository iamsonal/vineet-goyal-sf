import type { Luvio, FetchResponse } from '@luvio/engine';
import type { GetDatasetConfig } from '../../../generated/adapters/getDataset';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../generated/adapters/getDataset';
import type { ResourceRequestConfig } from '../../../generated/resources/getWaveDatasetsByDatasetIdOrApiName';
import { datasetNameToIdCache } from '../../utils/datasetNameToIdCache';

export function onResourceResponseError(
    luvio: Luvio,
    config: GetDatasetConfig,
    resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    datasetNameToIdCache.remove(config.datasetIdOrApiName);
    return generatedOnResourceResponseError(luvio, config, resourceParams, response);
}
