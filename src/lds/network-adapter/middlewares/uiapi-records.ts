import { ResourceRequest } from '@salesforce-lds/engine';

import { registerLdsCacheStats } from '../../instrumentation';
import { createStorage } from '../../storage';

import { actionConfig, UI_API_BASE_URI } from './uiapi-base';
import {
    buildUiApiParams,
    dispatchAction,
    DispatchActionConfig,
    shouldForceRefresh,
} from './utils';

enum UiApiRecordController {
    CreateRecord = 'RecordUiController.createRecord',
    DeleteRecord = 'RecordUiController.deleteRecord',
    ExecuteAggregateUi = 'RecordUiController.executeAggregateUi',
    GetLayout = 'RecordUiController.getLayout',
    GetLayoutUserState = 'RecordUiController.getLayoutUserState',
    GetRecordAvatars = 'RecordUiController.getRecordAvatars',
    GetRecordCreateDefaults = 'RecordUiController.getRecordCreateDefaults',
    GetRecordUi = 'RecordUiController.getRecordUis',
    GetRecordWithFields = 'RecordUiController.getRecordWithFields',
    GetRecordWithLayouts = 'RecordUiController.getRecordWithLayouts',
    GetObjectInfo = 'RecordUiController.getObjectInfo',
    GetPicklistValues = 'RecordUiController.getPicklistValues',
    GetPicklistValuesByRecordType = 'RecordUiController.getPicklistValuesByRecordType',
    UpdateRecord = 'RecordUiController.updateRecord',
    UpdateRecordAvatar = 'RecordUiController.postRecordAvatarAssociation',
    UpdateLayoutUserState = 'RecordUiController.updateLayoutUserState',
}

export const UIAPI_GET_LAYOUT = `${UI_API_BASE_URI}/layout/`;
export const UIAPI_RECORDS_PATH = `${UI_API_BASE_URI}/records`;
export const UIAPI_RECORD_AVATARS_BASE = `${UI_API_BASE_URI}/record-avatars/`;
export const UIAPI_RECORD_AVATARS_BATCH_PATH = `${UI_API_BASE_URI}/record-avatars/batch/`;
export const UIAPI_RECORD_AVATAR_UPDATE = `/association`;
export const UIAPI_RECORD_CREATE_DEFAULTS_PATH = `${UI_API_BASE_URI}/record-defaults/create/`;
export const UIAPI_RECORD_UI_PATH = `${UI_API_BASE_URI}/record-ui/`;
export const UIAPI_GET_LAYOUT_USER_STATE = '/user-state';
export const UIAPI_OBJECT_INFO_PATH = `${UI_API_BASE_URI}/object-info/`;

const objectInfoStorage = createStorage({
    name: 'ldsObjectInfo',
    expiration: 5 * 60, // 5 minutes, TODO W-6900122 - Make it sync with RAML definition
});
const objectInfoStorageStatsLogger = registerLdsCacheStats('getObjectInfo:storage');

const layoutStorage = createStorage({
    name: 'ldsLayout',
    expiration: 15 * 60, // 15 minutes, TODO W-6900122 -  Make it sync with RAML definition
});
const layoutStorageStatsLogger = registerLdsCacheStats('getLayout:storage');

const layoutUserStateStorage = createStorage({
    name: 'ldsLayoutUserState',
    expiration: 15 * 60, // 15 minutes, TODO W-6900122 - Make it sync with RAML definition
});
const layoutUserStateStorageStatsLogger = registerLdsCacheStats('getLayoutUserState:storage');

export function getObjectInfo(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
    const params = buildUiApiParams(
        {
            objectApiName: resourceRequest.urlParams.objectApiName,
        },
        resourceRequest
    );

    const config: DispatchActionConfig = { ...actionConfig };

    if (objectInfoStorage !== null) {
        config.cache = {
            storage: objectInfoStorage,
            key: cacheKey,
            statsLogger: objectInfoStorageStatsLogger,
            forceRefresh: shouldForceRefresh(resourceRequest),
        };
    }

    return dispatchAction(UiApiRecordController.GetObjectInfo, params, config);
}

export function getRecord(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;
    const { recordId } = urlParams;
    const { fields, layoutTypes, modes, optionalFields } = queryParams;

    let getRecordParams: any = {};
    let controller: UiApiRecordController;

    if (layoutTypes !== undefined) {
        getRecordParams = {
            recordId,
            layoutTypes,
            modes,
            optionalFields,
        };
        controller = UiApiRecordController.GetRecordWithLayouts;
    } else {
        getRecordParams = {
            recordId,
            fields,
            optionalFields,
        };
        controller = UiApiRecordController.GetRecordWithFields;
    }

    const params = buildUiApiParams(getRecordParams, resourceRequest);
    return dispatchAction(controller, params, actionConfig);
}

export function createRecord(resourceRequest: ResourceRequest): Promise<any> {
    const params = buildUiApiParams(
        {
            recordInput: resourceRequest.body,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.CreateRecord, params, actionConfig);
}

export function deleteRecord(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;
    const params = buildUiApiParams(
        {
            recordId: urlParams.recordId,
        },
        resourceRequest
    );
    return dispatchAction(UiApiRecordController.DeleteRecord, params, actionConfig);
}

export function updateRecord(resourceRequest: ResourceRequest): Promise<any> {
    const { body, urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            recordId: urlParams.recordId,
            recordInput: body,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateRecord, params, actionConfig);
}

export function updateLayoutUserState(resourceRequest: ResourceRequest): Promise<any> {
    const {
        body,
        urlParams: { objectApiName },
        queryParams: { layoutType, mode, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            layoutType,
            mode,
            recordTypeId,
            userState: body,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateLayoutUserState, params, actionConfig).then(
        response => {
            // TODO: Instead of surgically evicting the record that has been updated in the cache we
            // currently dump all the entries. We need a way to recreate the same cache key between
            // getLayoutUserState and updateLayoutUserState.
            if (layoutUserStateStorage !== null) {
                layoutUserStateStorage.clear();
            }

            return response;
        }
    );
}

export function getRecordAvatars(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const recordIds = urlParams.recordIds;
    const params = buildUiApiParams({ recordIds }, resourceRequest);

    return dispatchAction(UiApiRecordController.GetRecordAvatars, params, actionConfig);
}

export function updateRecordAvatar(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, body } = resourceRequest;
    const params = buildUiApiParams({ input: body, recordId: urlParams.recordId }, resourceRequest);
    return dispatchAction(UiApiRecordController.UpdateRecordAvatar, params, actionConfig);
}

export function getRecordUi(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordIds },
        queryParams: { layoutTypes, modes, optionalFields },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            layoutTypes,
            modes,
            optionalFields,
            recordIds,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRecordUi, params, actionConfig);
}

export function getPicklistValues(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName: urlParams.objectApiName,
            recordTypeId: urlParams.recordTypeId,
            fieldApiName: urlParams.fieldApiName,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetPicklistValues, params, actionConfig);
}

export function getPicklistValuesByRecordType(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(
        UiApiRecordController.GetPicklistValuesByRecordType,
        params,
        actionConfig
    );
}

export function getLayout(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { layoutType, mode, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            layoutType,
            mode,
            recordTypeId,
        },
        resourceRequest
    );

    const config: DispatchActionConfig = { ...actionConfig };
    if (layoutStorage !== null) {
        config.cache = {
            storage: layoutStorage,
            key: cacheKey,
            statsLogger: layoutStorageStatsLogger,
            forceRefresh: shouldForceRefresh(resourceRequest),
        };
    }

    return dispatchAction(UiApiRecordController.GetLayout, params, config);
}

export function getLayoutUserState(
    resourceRequest: ResourceRequest,
    cacheKey: string
): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { layoutType, mode, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            layoutType,
            mode,
            recordTypeId,
        },
        resourceRequest
    );

    const config: DispatchActionConfig = { ...actionConfig };
    if (layoutUserStateStorage !== null) {
        config.cache = {
            storage: layoutUserStateStorage,
            key: cacheKey,
            statsLogger: layoutUserStateStorageStatsLogger,
            forceRefresh: shouldForceRefresh(resourceRequest),
        };
    }

    return dispatchAction(UiApiRecordController.GetLayoutUserState, params, config);
}

export function getRecordCreateDefaults(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { formFactor, optionalFields, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            formFactor,
            recordTypeId,
            optionalFields,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRecordCreateDefaults, params, actionConfig);
}
