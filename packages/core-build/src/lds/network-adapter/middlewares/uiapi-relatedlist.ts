import { ResourceRequest } from '@ldsjs/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

enum UiApiRecordController {
    GetRelatedListInfo = 'RelatedListUiController.getRelatedListInfoByApiName',
    UpdateRelatedListInfo = 'RelatedListUiController.updateRelatedListInfoByApiName',
    GetRelatedListsInfo = 'RelatedListUiController.getRelatedListInfoCollection',
    GetRelatedListRecords = 'RelatedListUiController.getRelatedListRecords',
    GetRelatedListCount = 'RelatedListUiController.getRelatedListRecordCount',
    GetRelatedListCounts = 'RelatedListUiController.getRelatedListsRecordCount',
}

export const UIAPI_RELATED_LIST_INFO_PATH = `${UI_API_BASE_URI}/related-list-info`;
export const UIAPI_RELATED_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/related-list-records`;
export const UIAPI_RELATED_LIST_COUNT_PATH = `${UI_API_BASE_URI}/related-list-count`;

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

export function updateRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams, body } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListId: urlParams.relatedListId,
            recordTypeId: queryParams.recordTypeId,
            orderedByInfo: body.orderedByInfo,
            userPreferences: body.userPreferences,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateRelatedListInfo, params, body);
}

export function getRelatedListsInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListsInfo, params);
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

export function getRelatedListCount(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: urlParams.parentRecordId,
            relatedListName: urlParams.relatedListName,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListCount, params);
}

export function getRelatedListsCount(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: urlParams.parentRecordId,
            relatedListNames: urlParams.relatedListNames,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListCounts, params);
}
