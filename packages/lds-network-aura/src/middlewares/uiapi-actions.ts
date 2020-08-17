import { ResourceRequest } from '@ldsjs/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

enum UiApiActionsController {
    GetLookupActions = 'ActionsController.getLookupActions',
    GetRecordActions = 'ActionsController.getRecordActions',
    GetRecordEditActions = 'ActionsController.getRecordEditActions',
    GetObjectCreateActions = 'ActionsController.getObjectCreateActions',
    GetRelatedListActions = 'ActionsController.getRelatedListActions',
    GetRelatedListsActions = 'ActionsController.getRelatedListsActions',
    GetRelatedListRecordActions = 'ActionsController.getRelatedListRecordActions',
}

const UIAPI_ACTIONS_LOOKUP_PATH = `${UI_API_BASE_URI}/actions/lookup/`;
const UIAPI_ACTIONS_RECORD_PATH = `${UI_API_BASE_URI}/actions/record/`;
const UIAPI_ACTIONS_OBJECT_PATH = `${UI_API_BASE_URI}/actions/object/`;
const UIAPI_ACTIONS_RECORD_EDIT = '/record-edit';
const UIAPI_ACTIONS_RELATED_LIST = '/related-list/';
const UIAPI_ACTIONS_OBJECT_CREATE = '/record-create';
const UIAPI_ACTIONS_RELATED_LIST_BATCH = '/related-list/batch/';
const UIAPI_ACTIONS_RELATED_LIST_RECORD = '/related-list-record/';

function getLookupActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiNames },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ objectApiNames, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetLookupActions, parameters);
}

function getRecordActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ recordIds, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetRecordActions, parameters);
}

function getRecordEditActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ recordIds, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetRecordEditActions, parameters);
}

function getRelatedListActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds, relatedListId },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams(
        { recordIds, relatedListId, ...queryParams },
        resourceRequest
    );

    return dispatchAction(UiApiActionsController.GetRelatedListActions, parameters);
}

function getRelatedListsActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds, relatedListIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams(
        { recordIds, relatedListIds, ...queryParams },
        resourceRequest
    );

    return dispatchAction(UiApiActionsController.GetRelatedListsActions, parameters);
}

function getRelatedListRecordActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds, relatedListRecordIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams(
        { recordIds, relatedListRecordIds, ...queryParams },
        resourceRequest
    );

    return dispatchAction(UiApiActionsController.GetRelatedListRecordActions, parameters);
}

function getObjectCreateActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ objectApiName, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetObjectCreateActions, parameters);
}

appRouter.get((path: string) => path.startsWith(UIAPI_ACTIONS_LOOKUP_PATH), getLookupActions);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_RECORD_PATH) && path.endsWith(UIAPI_ACTIONS_RECORD_EDIT),
    getRecordEditActions
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_RECORD_PATH) &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST_RECORD) > 0,
    getRelatedListRecordActions
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_RECORD_PATH) &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST) > 0 &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST_BATCH) === -1,
    getRelatedListActions
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_RECORD_PATH) &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST_BATCH) > 0,
    getRelatedListsActions
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_RECORD_PATH) &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST) === -1 &&
        path.indexOf(UIAPI_ACTIONS_RELATED_LIST_RECORD) === -1 &&
        !path.endsWith(UIAPI_ACTIONS_RECORD_EDIT),
    getRecordActions
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_ACTIONS_OBJECT_PATH) && path.indexOf(UIAPI_ACTIONS_OBJECT_CREATE) > 0,
    getObjectCreateActions
);
