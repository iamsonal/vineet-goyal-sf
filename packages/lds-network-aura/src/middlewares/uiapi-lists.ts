import type { ResourceRequest } from '@luvio/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

enum UiApiListsController {
    GetListsByObjectName = 'ListUiController.getListsByObjectName',
    GetListUiById = 'ListUiController.getListUiById',
    GetListRecordsById = 'ListUiController.getListRecordsById',
    GetListUiByName = 'ListUiController.getListUiByName',
    GetListInfoByName = 'ListUiController.getListInfoByName',
    GetListInfosByName = 'ListUiController.getListInfosByName',
    GetListRecordsByName = 'ListUiController.getListRecordsByName',
}

const UIAPI_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/list-records/`;
const UIAPI_LIST_UI_PATH = `${UI_API_BASE_URI}/list-ui/`;
const UIAPI_LIST_INFO_PATH = `${UI_API_BASE_URI}/list-info/`;
const UIAPI_LIST_INFO_BATCH_PATH = `${UIAPI_LIST_INFO_PATH}batch`;

function getListRecordsByName(resourceRequest: ResourceRequest): Promise<any> {
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

function getListRecordsById(resourceRequest: ResourceRequest): Promise<any> {
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

function getListUiByName(resourceRequest: ResourceRequest): Promise<any> {
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

function getListUiById(resourceRequest: ResourceRequest): Promise<any> {
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

function getListInfoByName(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName, listViewApiName },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            listViewApiName,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListInfoByName, params);
}

function getListInfosByName(resourceRequest: ResourceRequest): Promise<any> {
    const {
        queryParams: { names },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            names,
        },
        resourceRequest
    );

    return dispatchAction(UiApiListsController.GetListInfosByName, params);
}

function getListsByObjectName(resourceRequest: ResourceRequest): Promise<any> {
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

// .../list-records/${objectApiName}/${listViewApiName}
appRouter.get(
    (path: string) => path.startsWith(UIAPI_LIST_RECORDS_PATH) && /list-records\/.*\//.test(path),
    getListRecordsByName
);
// .../list-records/${listViewId}
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_LIST_RECORDS_PATH) && /list-records\/.*\//.test(path) === false,
    getListRecordsById
);
// .../list-ui/${objectApiName}/${listViewApiName}
appRouter.get(
    (path: string) => path.startsWith(UIAPI_LIST_UI_PATH) && /list-ui\/.*\//.test(path),
    getListUiByName
);
// .../list-ui/${listViewId}
appRouter.get(
    (path: string) => path.startsWith(UIAPI_LIST_UI_PATH) && /00B[a-zA-Z\d]{15}$/.test(path),
    getListUiById
);
// .../list-ui/${objectApiName}
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_LIST_UI_PATH) &&
        /list-ui\/.*\//.test(path) === false &&
        /00B[a-zA-Z\d]{15}$/.test(path) === false,
    getListsByObjectName
);

// .../list-info/batch
appRouter.get(
    (path: string) => path.startsWith(`${UIAPI_LIST_INFO_BATCH_PATH}`),
    getListInfosByName
);

// .../list-info/${objectApiName}/${listViewApiName}
appRouter.get(
    (path: string) => path.startsWith(UIAPI_LIST_INFO_PATH) && /list-info\/.*\//.test(path),
    getListInfoByName
);
