import { Luvio, FetchResponse } from '@luvio/engine';
import {
    GetDatasetConfig,
    onResourceResponseError as generatedOnResourceResponseError,
} from '../../../generated/adapters/getDataset';
import { ResourceRequestConfig } from '../../../generated/resources/getWaveDatasetsByDatasetIdOrApiName';
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
