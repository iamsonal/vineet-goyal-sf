import { ResourceRequest } from '@salesforce-lds/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

enum UiApiRecordController {
    GetRelatedListInfo = 'RelatedListUiController.getRelatedListInfoByApiName',
    GetRelatedListInfos = 'RelatedListUiController.getRelatedListInfoCollection',
    GetRelatedListRecords = 'RelatedListUiController.getRelatedListRecords',
}

export const UIAPI_RELATED_LIST_INFO_PATH = `${UI_API_BASE_URI}/related-list-info`;
export const UIAPI_RELATED_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/related-list-records`;

export function getRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListId: urlParams.relatedListId,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListInfo, params);
}

export function getRelatedListInfos(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListInfos, params);
}

export function getRelatedListRecords(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId, relatedListId },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            relatedListId: relatedListId,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListRecords, params);
}
