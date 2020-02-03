import { ResourceRequest } from '@ldsjs/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

enum UiApiListsController {
    GetListsByObjectName = 'ListUiController.getListsByObjectName',
    GetListUiById = 'ListUiController.getListUiById',
    GetListRecordsById = 'ListUiController.getListRecordsById',
    GetListUiByName = 'ListUiController.getListUiByName',
    GetListRecordsByName = 'ListUiController.getListRecordsByName',
}

export const UIAPI_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/list-records/`;
export const UIAPI_LIST_UI_PATH = `${UI_API_BASE_URI}/list-ui/`;

export function getListRecordsByName(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName, listViewApiName },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            listViewApiName,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListRecordsByName, params);
}

export function getListRecordsById(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { listViewId },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            listViewId,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListRecordsById, params);
}

export function getListUiByName(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName, listViewApiName },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            listViewApiName,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListUiByName, params);
}

export function getListUiById(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { listViewId },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            listViewId,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListUiById, params);
}

export function getListsByObjectName(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { pageSize, pageToken, q, recentListsOnly },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            pageSize,
            pageToken,
            q,
            recentListsOnly,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListsByObjectName, params);
}
