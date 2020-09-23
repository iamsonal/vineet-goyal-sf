import { ResourceRequest } from '@ldsjs/engine';

import {
    incrementGetRecordAggregateInvokeCount,
    incrementGetRecordNormalInvokeCount,
    logCRUDLightningInteraction,
    registerLdsCacheStats,
} from '@salesforce/lds-instrumentation';
import { createStorage } from '@salesforce/lds-aura-storage';

import { actionConfig, UI_API_BASE_URI } from './uiapi-base';
import {
    buildUiApiParams,
    dispatchAction,
    DispatchActionConfig,
    shouldForceRefresh,
    InstrumentationRejectCallback,
    InstrumentationRejectConfig,
    InstrumentationResolveCallback,
    InstrumentationResolveConfig,
} from './utils';
import {
    buildGetRecordByFieldsCompositeRequest,
    dispatchSplitRecordAggregateUiAction,
    shouldUseAggregateUiForGetRecord,
} from './execute-aggregate-ui';
import appRouter from '../router';
import { ArrayIsArray } from '../utils/language';
import { getEnvironmentSetting, EnvironmentSettings } from '@salesforce/lds-environment-settings';

enum UiApiRecordController {
    CreateRecord = 'RecordUiController.createRecord',
    DeleteRecord = 'RecordUiController.deleteRecord',
    ExecuteAggregateUi = 'RecordUiController.executeAggregateUi',
    GetLayout = 'RecordUiController.getLayout',
    GetLayoutUserState = 'RecordUiController.getLayoutUserState',
    GetRecordAvatars = 'RecordUiController.getRecordAvatars',
    GetRecordTemplateClone = 'RecordUiController.getRecordDefaultsTemplateClone',
    GetRecordTemplateCreate = 'RecordUiController.getRecordDefaultsTemplateForCreate',
    GetRecordCreateDefaults = 'RecordUiController.getRecordCreateDefaults',
    GetRecordUi = 'RecordUiController.getRecordUis',
    GetRecordWithFields = 'RecordUiController.getRecordWithFields',
    GetRecordWithLayouts = 'RecordUiController.getRecordWithLayouts',
    GetObjectInfo = 'RecordUiController.getObjectInfo',
    GetObjectInfos = 'RecordUiController.getObjectInfos',
    GetPicklistValues = 'RecordUiController.getPicklistValues',
    GetPicklistValuesByRecordType = 'RecordUiController.getPicklistValuesByRecordType',
    UpdateRecord = 'RecordUiController.updateRecord',
    UpdateRecordAvatar = 'RecordUiController.postRecordAvatarAssociation',
    UpdateLayoutUserState = 'RecordUiController.updateLayoutUserState',
    GetDuplicateConfiguration = 'RecordUiController.getDedupeConfig',
    GetDuplicates = 'RecordUiController.findDuplicates',
}

const UIAPI_GET_LAYOUT = `${UI_API_BASE_URI}/layout/`;
const UIAPI_RECORDS_PATH = `${UI_API_BASE_URI}/records`;
const UIAPI_RECORD_AVATARS_BASE = `${UI_API_BASE_URI}/record-avatars/`;
const UIAPI_RECORD_AVATARS_BATCH_PATH = `${UI_API_BASE_URI}/record-avatars/batch/`;
const UIAPI_RECORD_AVATAR_UPDATE = `/association`;
const UIAPI_RECORD_TEMPLATE_CLONE_PATH = `${UI_API_BASE_URI}/record-defaults/template/clone/`;
const UIAPI_RECORD_TEMPLATE_CREATE_PATH = `${UI_API_BASE_URI}/record-defaults/template/create/`;
const UIAPI_RECORD_CREATE_DEFAULTS_PATH = `${UI_API_BASE_URI}/record-defaults/create/`;
const UIAPI_RECORD_UI_PATH = `${UI_API_BASE_URI}/record-ui/`;
const UIAPI_GET_LAYOUT_USER_STATE = '/user-state';
const UIAPI_OBJECT_INFO_PATH = `${UI_API_BASE_URI}/object-info/`;
const UIAPI_OBJECT_INFO_BATCH_PATH = `${UI_API_BASE_URI}/object-info/batch/`;
const UIAPI_DUPLICATE_CONFIGURATION_PATH = `${UI_API_BASE_URI}/duplicates/`;
const UIAPI_DUPLICATES_PATH = `${UI_API_BASE_URI}/predupe`;

enum CrudEventType {
    CREATE = 'create',
    DELETE = 'delete',
    READ = 'read',
    UPDATE = 'update',
}

enum CrudEventState {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
}

interface CrudInstrumentationCallbacks {
    createRecordRejectFunction: InstrumentationRejectCallback;
    createRecordResolveFunction: InstrumentationResolveCallback;
    deleteRecordRejectFunction: InstrumentationRejectCallback;
    deleteRecordResolveFunction: InstrumentationResolveCallback;
    getRecordAggregateRejectFunction: InstrumentationRejectCallback;
    getRecordAggregateResolveFunction: InstrumentationResolveCallback;
    getRecordRejectFunction: InstrumentationRejectCallback;
    getRecordResolveFunction: InstrumentationResolveCallback;
    updateRecordRejectFunction: InstrumentationRejectCallback;
    updateRecordResolveFunction: InstrumentationResolveCallback;
}

let crudInstrumentationCallbacks: CrudInstrumentationCallbacks | null = null;

const forceRecordTransactionsDisabled: boolean | undefined = getEnvironmentSetting(
    EnvironmentSettings.ForceRecordTransactionsDisabled
);

if (forceRecordTransactionsDisabled === false) {
    crudInstrumentationCallbacks = {
        createRecordRejectFunction: (config: InstrumentationRejectConfig) => {
            logCRUDLightningInteraction(CrudEventType.CREATE, {
                recordId: config.params.recordInput.apiName,
                state: CrudEventState.ERROR,
            });
        },
        createRecordResolveFunction: (config: InstrumentationResolveConfig) => {
            logCRUDLightningInteraction(CrudEventType.CREATE, {
                recordId: config.body.id,
                recordType: config.body.apiName,
                state: CrudEventState.SUCCESS,
            });
        },
        deleteRecordRejectFunction: (config: InstrumentationRejectConfig) => {
            logCRUDLightningInteraction(CrudEventType.DELETE, {
                recordId: config.params.recordId,
                state: CrudEventState.ERROR,
            });
        },
        deleteRecordResolveFunction: (config: InstrumentationResolveConfig) => {
            logCRUDLightningInteraction(CrudEventType.DELETE, {
                recordId: config.params.recordId,
                state: CrudEventState.SUCCESS,
            });
        },
        getRecordAggregateRejectFunction: (config: InstrumentationRejectConfig) => {
            logCRUDLightningInteraction(CrudEventType.READ, {
                recordId: config.params.recordId,
                state: CrudEventState.ERROR,
            });
        },
        getRecordAggregateResolveFunction: (config: InstrumentationResolveConfig) => {
            logCRUDLightningInteraction(CrudEventType.READ, {
                recordId: config.params.recordId,
                recordType: config.body.apiName,
                state: CrudEventState.SUCCESS,
            });
        },
        getRecordRejectFunction: (config: InstrumentationRejectConfig) => {
            logCRUDLightningInteraction(CrudEventType.READ, {
                recordId: config.params.recordId,
                state: CrudEventState.ERROR,
            });
        },
        getRecordResolveFunction: (config: InstrumentationResolveConfig) => {
            logCRUDLightningInteraction(CrudEventType.READ, {
                recordId: config.params.recordId,
                recordType: config.body.apiName,
                state: CrudEventState.SUCCESS,
            });
        },
        updateRecordRejectFunction: (config: InstrumentationRejectConfig) => {
            logCRUDLightningInteraction(CrudEventType.UPDATE, {
                recordId: config.params.recordId,
                state: CrudEventState.ERROR,
            });
        },
        updateRecordResolveFunction: (config: InstrumentationResolveConfig) => {
            logCRUDLightningInteraction(CrudEventType.UPDATE, {
                recordId: config.params.recordId,
                recordType: config.body.apiName,
                state: CrudEventState.SUCCESS,
            });
        },
    };
}

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

function getObjectInfo(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
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

function getObjectInfos(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
    const params = buildUiApiParams(
        {
            objectApiNames: resourceRequest.urlParams.objectApiNames,
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

    return dispatchAction(UiApiRecordController.GetObjectInfos, params, config);
}

function getRecord(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;
    const { recordId } = urlParams;
    const { fields, layoutTypes, modes, optionalFields } = queryParams;

    const fieldsArray: string[] =
        fields !== undefined && ArrayIsArray(fields) ? (fields as string[]) : [];

    const optionalFieldsArray: string[] =
        optionalFields !== undefined && Array.isArray(optionalFields)
            ? (optionalFields as string[])
            : [];

    const fieldsString = fieldsArray.join(',');
    const optionalFieldsString = optionalFieldsArray.join(',');
    // Don't submit a megarequest to UIAPI due to SOQL limit reasons.
    // Split and aggregate if needed
    const useAggregateUi: boolean = shouldUseAggregateUiForGetRecord(
        fieldsString,
        optionalFieldsString
    );

    if (useAggregateUi) {
        incrementGetRecordAggregateInvokeCount();

        const compositeRequest = buildGetRecordByFieldsCompositeRequest(
            recordId as string,
            resourceRequest,
            {
                fieldsArray,
                optionalFieldsArray,
                fieldsLength: fieldsString.length,
                optionalFieldsLength: optionalFieldsString.length,
            }
        );

        const aggregateUiParams = {
            input: {
                compositeRequest,
            },
        };

        const instrumentationCallbacks =
            crudInstrumentationCallbacks !== null
                ? {
                      rejectFn: crudInstrumentationCallbacks.getRecordAggregateRejectFunction,
                      resolveFn: crudInstrumentationCallbacks.getRecordAggregateResolveFunction,
                  }
                : {};

        return dispatchSplitRecordAggregateUiAction(
            UiApiRecordController.ExecuteAggregateUi,
            aggregateUiParams,
            actionConfig,
            recordId as string,
            instrumentationCallbacks
        );
    }

    let getRecordParams: any = {};
    let controller: UiApiRecordController;

    incrementGetRecordNormalInvokeCount();

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
    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.getRecordRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.getRecordResolveFunction,
              }
            : {};
    return dispatchAction(controller, params, actionConfig, instrumentationCallbacks);
}

function createRecord(resourceRequest: ResourceRequest): Promise<any> {
    const {
        body,
        queryParams: { useDefaultRule, triggerUserEmail },
    } = resourceRequest;
    const params = buildUiApiParams(
        {
            useDefaultRule,
            triggerUserEmail,
            recordInput: body,
        },
        resourceRequest
    );
    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.createRecordRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.createRecordResolveFunction,
              }
            : {};
    return dispatchAction(
        UiApiRecordController.CreateRecord,
        params,
        actionConfig,
        instrumentationCallbacks
    );
}

function deleteRecord(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;
    const params = buildUiApiParams(
        {
            recordId: urlParams.recordId,
        },
        resourceRequest
    );
    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.deleteRecordRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.deleteRecordResolveFunction,
              }
            : {};
    return dispatchAction(
        UiApiRecordController.DeleteRecord,
        params,
        actionConfig,
        instrumentationCallbacks
    );
}

function updateRecord(resourceRequest: ResourceRequest): Promise<any> {
    const {
        body,
        urlParams,
        queryParams: { useDefaultRule, triggerUserEmail },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            useDefaultRule,
            triggerUserEmail,
            recordId: urlParams.recordId,
            recordInput: body,
        },
        resourceRequest
    );
    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.updateRecordRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.updateRecordResolveFunction,
              }
            : {};
    return dispatchAction(
        UiApiRecordController.UpdateRecord,
        params,
        actionConfig,
        instrumentationCallbacks
    );
}

function updateLayoutUserState(resourceRequest: ResourceRequest): Promise<any> {
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
                try {
                    layoutUserStateStorage.clear();
                } catch (error) {
                    /* noop */
                }
            }

            return response;
        }
    );
}

function getRecordAvatars(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const recordIds = urlParams.recordIds;
    const params = buildUiApiParams({ recordIds }, resourceRequest);

    return dispatchAction(UiApiRecordController.GetRecordAvatars, params, actionConfig);
}

function updateRecordAvatar(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, body } = resourceRequest;
    const params = buildUiApiParams({ input: body, recordId: urlParams.recordId }, resourceRequest);
    return dispatchAction(UiApiRecordController.UpdateRecordAvatar, params, actionConfig);
}

function getRecordUi(resourceRequest: ResourceRequest): Promise<any> {
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

function getPicklistValues(resourceRequest: ResourceRequest): Promise<any> {
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

function getPicklistValuesByRecordType(resourceRequest: ResourceRequest): Promise<any> {
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

function getLayout(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
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

function getLayoutUserState(resourceRequest: ResourceRequest, cacheKey: string): Promise<any> {
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

function getRecordTemplateClone(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { recordId },
        queryParams: { optionalFields, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            recordId,
            recordTypeId,
            optionalFields,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRecordTemplateClone, params, actionConfig);
}

function getRecordTemplateCreate(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { objectApiName },
        queryParams: { optionalFields, recordTypeId },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            objectApiName,
            recordTypeId,
            optionalFields,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRecordTemplateCreate, params, actionConfig);
}

function getRecordCreateDefaults(resourceRequest: ResourceRequest): Promise<any> {
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

function getDuplicateConfiguration(resourceRequest: ResourceRequest): Promise<any> {
    const params = buildUiApiParams(
        {
            objectApiName: resourceRequest.urlParams.objectApiName,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetDuplicateConfiguration, params, actionConfig);
}

function getDuplicates(resourceRequest: ResourceRequest): Promise<any> {
    const { body } = resourceRequest;

    const params = buildUiApiParams(
        {
            recordInput: body,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetDuplicates, params, actionConfig);
}

appRouter.delete((path: string) => path.startsWith(UIAPI_RECORDS_PATH), deleteRecord);

appRouter.patch((path: string) => path.startsWith(UIAPI_RECORDS_PATH), updateRecord);
appRouter.patch(
    (path: string) =>
        path.startsWith(UIAPI_GET_LAYOUT) && path.endsWith(UIAPI_GET_LAYOUT_USER_STATE),
    updateLayoutUserState
);

appRouter.post((path: string) => path === UIAPI_RECORDS_PATH, createRecord);
appRouter.post(
    (path: string) =>
        path.startsWith(UIAPI_RECORD_AVATARS_BASE) && path.endsWith(UIAPI_RECORD_AVATAR_UPDATE),
    updateRecordAvatar
);

appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_GET_LAYOUT) && path.endsWith(UIAPI_GET_LAYOUT_USER_STATE),
    getLayoutUserState
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_GET_LAYOUT) && path.endsWith(UIAPI_GET_LAYOUT_USER_STATE) === false,
    getLayout
);
// object-info/batch/
appRouter.get((path: string) => path.startsWith(UIAPI_OBJECT_INFO_BATCH_PATH), getObjectInfos);
// object-info/API_NAME/picklist-values/RECORD_TYPE_ID/FIELD_API_NAME
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_OBJECT_INFO_PATH) &&
        /picklist-values\/[a-zA-Z\d]+\/[a-zA-Z\d]+/.test(path),
    getPicklistValues
);
// object-info/API_NAME/picklist-values/RECORD_TYPE_ID
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_OBJECT_INFO_PATH) && /picklist-values\/[a-zA-Z\d]+/.test(path),
    getPicklistValuesByRecordType
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_OBJECT_INFO_PATH) &&
        path.startsWith(UIAPI_OBJECT_INFO_BATCH_PATH) === false &&
        /picklist-values\/[a-zA-Z\d]+\/[a-zA-Z\d]+/.test(path) === false &&
        /picklist-values\/[a-zA-Z\d]+/.test(path) === false,
    getObjectInfo
);
appRouter.get((path: string) => path.startsWith(UIAPI_RECORDS_PATH), getRecord);
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RECORD_TEMPLATE_CLONE_PATH),
    getRecordTemplateClone
);
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RECORD_TEMPLATE_CREATE_PATH),
    getRecordTemplateCreate
);
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RECORD_CREATE_DEFAULTS_PATH),
    getRecordCreateDefaults
);
appRouter.get((path: string) => path.startsWith(UIAPI_RECORD_AVATARS_BATCH_PATH), getRecordAvatars);
appRouter.get((path: string) => path.startsWith(UIAPI_RECORD_UI_PATH), getRecordUi);

appRouter.get(
    (path: string) => path.startsWith(UIAPI_DUPLICATE_CONFIGURATION_PATH),
    getDuplicateConfiguration
);
appRouter.post((path: string) => path.startsWith(UIAPI_DUPLICATES_PATH), getDuplicates);
