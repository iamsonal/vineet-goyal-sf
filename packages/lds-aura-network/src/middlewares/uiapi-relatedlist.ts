import { ResourceRequest } from '@ldsjs/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

enum UiApiRecordController {
    GetRelatedListInfo = 'RelatedListUiController.getRelatedListInfoByApiName',
    UpdateRelatedListInfo = 'RelatedListUiController.updateRelatedListInfoByApiName',
    GetRelatedListsInfo = 'RelatedListUiController.getRelatedListInfoCollection',
    GetRelatedListRecords = 'RelatedListUiController.getRelatedListRecords',
    GetRelatedListCount = 'RelatedListUiController.getRelatedListRecordCount',
    GetRelatedListCounts = 'RelatedListUiController.getRelatedListsRecordCount',
    GetRelatedListInfoBatch = 'RelatedListUiController.getRelatedListInfoBatch',
    GetRelatedListRecordsBatch = 'RelatedListUiController.getRelatedListRecordsBatch',
}

const UIAPI_RELATED_LIST_INFO_PATH = `${UI_API_BASE_URI}/related-list-info`;
const UIAPI_RELATED_LIST_INFO_BATCH_PATH = `${UI_API_BASE_URI}/related-list-info/batch`;
const UIAPI_RELATED_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/related-list-records`;
const UIAPI_RELATED_LIST_RECORDS_BATCH_PATH = `${UI_API_BASE_URI}/related-list-records/batch`;
const UIAPI_RELATED_LIST_COUNT_PATH = `${UI_API_BASE_URI}/related-list-count`;

function getRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
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

function updateRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams, body } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListId: urlParams.relatedListId,
            recordTypeId: queryParams.recordTypeId,
            relatedListInfoInput: {
                orderedByInfo: body.orderedByInfo,
                userPreferences: body.userPreferences,
            },
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateRelatedListInfo, params);
}

function getRelatedListsInfo(resourceRequest: ResourceRequest): Promise<any> {
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

function getRelatedListRecords(resourceRequest: ResourceRequest): Promise<any> {
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

function getRelatedListRecordsBatch(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId, relatedListIds },
        queryParams: { fields, optionalFields, pageSize, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            relatedListIds: relatedListIds,
            fields,
            optionalFields,
            pageSize,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListRecordsBatch, params);
}

function getRelatedListCount(resourceRequest: ResourceRequest): Promise<any> {
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

function getRelatedListsCount(resourceRequest: ResourceRequest): Promise<any> {
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

function getRelatedListInfoBatch(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListNames: urlParams.relatedListNames,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListInfoBatch, params);
}

appRouter.patch(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_INFO_PATH),
    updateRelatedListInfo
);
// related-list-info/batch/API_NAME/RELATED_LIST_IDS
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_BATCH_PATH) &&
        /related-list-info\/batch\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path),
    getRelatedListInfoBatch
);
// related-list-info/API_NAME/RELATED_LIST_ID
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_PATH) &&
        /related-list-info\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path),
    getRelatedListInfo
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_PATH) &&
        /related-list-info\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path) === false,
    getRelatedListsInfo
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH) === false,
    getRelatedListRecords
);
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH),
    getRelatedListRecordsBatch
);
// related-list-count/batch/parentRecordId/relatedListNames
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH + '/batch'),
    getRelatedListsCount
);
// related-list-count/parentRecordId/relatedListName
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH + '/batch') === false,
    getRelatedListCount
);
