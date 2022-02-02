import { Luvio, FetchResponse } from '@luvio/engine';
import {
    GetWaveTemplateReleaseNotesConfig,
    onResourceResponseError as generatedOnResourceResponseError,
} from '../../../generated/adapters/getWaveTemplateReleaseNotes';
import { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesReleasenotesByTemplateIdOrApiName';
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
