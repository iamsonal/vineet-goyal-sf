import type { Luvio, ResourceResponse } from '@luvio/engine';
import type { GetManagedContentConfig } from '../../../generated/adapters/getManagedContent';
import { onResourceResponseSuccess as generatedOnResourceResponseSuccess } from '../../../generated/adapters/getManagedContent';
import type { ResourceRequestConfig } from '../../../generated/resources/getConnectCmsContentsByContentKeyOrId';
import type { ManagedContentDocumentRepresentation } from '../../../generated/types/ManagedContentDocumentRepresentation';

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetManagedContentConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<ManagedContentDocumentRepresentation>
) {
    let updatedResourceParams = resourceParams;
    // If language is not provided in the request resource params use language returned in the response and update resource params with that language,
    // since this resource params will be used later to build a cache key.
    if (updatedResourceParams.queryParams.language === undefined) {
        updatedResourceParams = {
            ...updatedResourceParams,
            queryParams: { language: response.body.language },
        };
    }

    return generatedOnResourceResponseSuccess(luvio, config, updatedResourceParams, response);
}
