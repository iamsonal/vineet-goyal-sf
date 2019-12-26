import { ResourceRequest } from '@salesforce-lds/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

export const UIAPI_LOOKUP_RECORDS = `${UI_API_BASE_URI}/lookups`;

const LookupRecords = 'LookupController.getLookupRecords';

export function lookupRecords(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            ...urlParams,
            ...queryParams,
        },
        resourceRequest
    );

    return dispatchAction(LookupRecords, params);
}
