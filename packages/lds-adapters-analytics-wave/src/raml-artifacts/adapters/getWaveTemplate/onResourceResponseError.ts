import type { Luvio, FetchResponse } from '@luvio/engine';
import type { GetWaveTemplateConfig } from '../../../generated/adapters/getWaveTemplate';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../generated/adapters/getWaveTemplate';
import type { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesByTemplateIdOrApiName';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function onResourceResponseError(
    luvio: Luvio,
    config: GetWaveTemplateConfig,
    resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    templateNameToIdCache.remove(config.templateIdOrApiName);
    return generatedOnResourceResponseError(luvio, config, resourceParams, response);
}
