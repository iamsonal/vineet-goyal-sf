import { Luvio, ResourceResponse } from '@luvio/engine';
import {
    GetWaveTemplateReleaseNotesConfig,
    onResourceResponseSuccess as generatedOnResourceResponseSuccess,
} from '../../../generated/adapters/getWaveTemplateReleaseNotes';
import { ResourceRequestConfig } from '../../../generated/resources/getWaveTemplatesReleasenotesByTemplateIdOrApiName';
import { TemplateReleaseNotesRepresentation } from '../../../generated/types/TemplateReleaseNotesRepresentation';
import { templateApiName, templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetWaveTemplateReleaseNotesConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<TemplateReleaseNotesRepresentation>
) {
    // save off the name->id for the next request
    if (response.body !== null && response.body !== undefined && response.body.name) {
        templateNameToIdCache.set(templateApiName(response.body), response.body.id);
    }
    let cacheResourceParams: ResourceRequestConfig;
    // we need to always cache on the templateId, so check if the urlParams was not using the returned id
    if (
        resourceParams.urlParams.templateIdOrApiName !==
        (response.body === null || response.body === undefined ? undefined : response.body.id)
    ) {
        // and switch it to use the id in the response, so ingestSuccess() will use that to gen the cache key
        cacheResourceParams = {
            ...resourceParams,
            urlParams: { templateIdOrApiName: response.body.id },
        };
    } else {
        cacheResourceParams = resourceParams;
    }

    return generatedOnResourceResponseSuccess(luvio, config, cacheResourceParams, response);
}
