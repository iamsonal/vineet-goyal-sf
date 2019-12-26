import { ResourceRequest } from '@salesforce-lds/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

enum UiApiMruListsController {
    GetMruListUi = 'MruListUiController.getMruListUi',
    GetMruListRecords = 'MruListUiController.getMruListRecords',
}

export const UIAPI_MRU_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/mru-list-records/`;
export const UIAPI_MRU_LIST_UI_PATH = `${UI_API_BASE_URI}/mru-list-ui/`;

export function getMruListRecords(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiMruListsController.GetMruListRecords, params);
}

export function getMruListUi(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiMruListsController.GetMruListUi, params);
}
