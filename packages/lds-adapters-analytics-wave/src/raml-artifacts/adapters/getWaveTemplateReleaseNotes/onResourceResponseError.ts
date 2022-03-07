import type { Luvio, FetchResponse } from '@luvio/engine';
import type { GetWaveTemplateReleaseNotesConfig } from '../../../generated/adapters/getWaveTemplateReleaseNotes';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../generated/adapters/getWaveTemplateReleaseNotes';
import type { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesReleasenotesByTemplateIdOrApiName';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function onResourceResponseError(
    luvio: Luvio,
    config: GetWaveTemplateReleaseNotesConfig,
    resourceParams: ResourceRequestConfig,
    response: FetchResponse<unknown>
) {
    templateNameToIdCache.remove(config.templateIdOrApiName);
    return generatedOnResourceResponseError(luvio, config, resourceParams, response);
}
