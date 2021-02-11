import { Luvio, ResourceResponse } from '@luvio/engine';
import {
    GetDatasetConfig,
    onResourceResponseSuccess as generatedOnResourceResponseSuccess,
} from '../../../generated/adapters/getDataset';
import { ResourceRequestConfig } from '../../../generated/resources/getWaveDatasetsByDatasetIdOrApiName';
import { DatasetRepresentation } from '../../../generated/types/DatasetRepresentation';
import { datasetNameToIdCache } from '../../utils/datasetNameToIdCache';

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetDatasetConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<DatasetRepresentation>
) {
    // save off the name->id for the next request
    if (response.body?.name) {
        datasetNameToIdCache.set(response.body.name, response.body.id);
    }
    let cacheResourceParams: ResourceRequestConfig;
    // we need to always cache on the datasetId, so check if the urlParams was not using the returned id
    if (resourceParams.urlParams.datasetIdOrApiName !== response.body?.id) {
        // and switch it to use the id in the response, so ingestSuccess() will use that to gen the cache key
        cacheResourceParams = {
            ...resourceParams,
            urlParams: { datasetIdOrApiName: response.body.id },
        };
    } else {
        cacheResourceParams = resourceParams;
    }

    return generatedOnResourceResponseSuccess(luvio, config, cacheResourceParams, response);
}
