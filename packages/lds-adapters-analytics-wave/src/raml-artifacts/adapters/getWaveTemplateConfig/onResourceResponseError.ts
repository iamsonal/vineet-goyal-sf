import type { Luvio, FetchResponse } from '@luvio/engine';
import type { GetWaveTemplateConfigConfig } from '../../../generated/adapters/getWaveTemplateConfig';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../generated/adapters/getWaveTemplateConfig';
import type { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesConfigurationByTemplateIdOrApiName';
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
