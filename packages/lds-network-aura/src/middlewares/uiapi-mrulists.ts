import { ResourceRequest } from '@luvio/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

enum UiApiMruListsController {
    GetMruListUi = 'MruListUiController.getMruListUi',
    GetMruListRecords = 'MruListUiController.getMruListRecords',
}

const UIAPI_MRU_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/mru-list-records/`;
const UIAPI_MRU_LIST_UI_PATH = `${UI_API_BASE_URI}/mru-list-ui/`;

function getMruListRecords(resourceRequest: ResourceRequest): Promise<any> {
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

function getMruListUi(resourceRequest: ResourceRequest): Promise<any> {
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

appRouter.get((path: string) => path.startsWith(UIAPI_MRU_LIST_RECORDS_PATH), getMruListRecords);
appRouter.get((path: string) => path.startsWith(UIAPI_MRU_LIST_UI_PATH), getMruListUi);
