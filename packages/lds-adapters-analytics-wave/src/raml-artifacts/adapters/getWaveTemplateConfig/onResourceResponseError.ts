import { Luvio, FetchResponse } from '@luvio/engine';
import {
    GetWaveTemplateConfigConfig,
    onResourceResponseError as generatedOnResourceResponseError,
} from '../../../generated/adapters/getWaveTemplateConfig';
import { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesConfigurationByTemplateIdOrApiName';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function onResourceResponseError(
    luvio: Luvio,
    config: GetWaveTemplateConfigConfig,
    resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    templateNameToIdCache.remove(config.templateIdOrApiName);
    return generatedOnResourceResponseError(luvio, config, resourceParams, response);
}
