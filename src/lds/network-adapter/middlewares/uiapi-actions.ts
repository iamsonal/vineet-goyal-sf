import { ResourceRequest } from '@salesforce-lds/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';

enum UiApiActionsController {
    GetLookupActions = 'ActionsController.getLookupActions',
    GetRecordActions = 'ActionsController.getRecordActions',
    GetRecordEditActions = 'ActionsController.getRecordEditActions',
    GetRelatedListActions = 'ActionsController.getRelatedListActions',
    GetRelatedListRecordActions = 'ActionsController.getRelatedListRecordActions',
}

export const UIAPI_ACTIONS_LOOKUP_PATH = `${UI_API_BASE_URI}/actions/lookup/`;
export const UIAPI_ACTIONS_RECORD_PATH = `${UI_API_BASE_URI}/actions/record/`;
export const UIAPI_ACTIONS_RECORD_EDIT = '/record-edit';
export const UIAPI_ACTIONS_RELATED_LIST = '/related-list/';
export const UIAPI_ACTIONS_RELATED_LIST_RECORD = '/related-list-record/';

export function getLookupActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiNames },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ objectApiNames, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetLookupActions, parameters);
}

export function getRecordActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ recordIds, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetRecordActions, parameters);
}

export function getRecordEditActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams({ recordIds, ...queryParams }, resourceRequest);

    return dispatchAction(UiApiActionsController.GetRecordEditActions, parameters);
}

export function getRelatedListActions(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds, relatedListIds },
        queryParams,
    } = resourceRequest;
    const parameters = buildUiApiParams(
        { recordIds, relatedListIds, ...queryParams },
        resourceRequest
    );

    return dispatchAction(UiApiActionsController.GetRelatedListActions, parameters);
}

export function getRelatedListRecordActions(resourceRequest: ResourceRequest): Promise<any> {
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
