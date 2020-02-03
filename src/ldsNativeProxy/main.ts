import * as wireService from 'wire-service';

import { LDSNative } from '@ldsjs/engine';
import {
    CreateRecord_Native,
    DeleteRecord_Native,
    GetLayout_Native,
    GetLayoutUserState_Native,
    GetListUi_Native,
    GetLookupActions_Native,
    GetLookupRecords_Native,
    GetObjectInfo_Native,
    GetPicklistValues_Native,
    GetPicklistValuesByRecordType_Native,
    GetRecord_Native,
    GetRecordActions_Native,
    GetRecordAvatars_Native,
    GetRecordCreateDefaults_Native,
    GetRecordEditActions_Native,
    GetRecordUi_Native,
    GetRelatedListActions_Native,
    GetRelatedListInfo_Native,
    GetRelatedListInfos_Native,
    GetRelatedListRecordActions_Native,
    GetRelatedListRecords_Native,
    MRU,
    UpdateRecordAvatar_Native,
} from '@salesforce-lds-api/uiapi-records';

import { coreCompliantUpdateRecordFactory } from './custom-adapters/updateRecord';
import { getLdsNativeProxyPlugin } from './ldsNativeProxyPlugin';

const ldsNative = new LDSNative(wireService, getLdsNativeProxyPlugin());

/**
 * UI API
 */
export const createRecord = ldsNative.register(CreateRecord_Native, true);
export const deleteRecord = ldsNative.register(DeleteRecord_Native, true);
export const getLayout = ldsNative.register(GetLayout_Native);
export const getLayoutUserState = ldsNative.register(GetLayoutUserState_Native);
export const getListUi = ldsNative.register(GetListUi_Native);
export const getLookupActions = ldsNative.register(GetLookupActions_Native);
export const getLookupRecords = ldsNative.register(GetLookupRecords_Native);
export const getObjectInfo = ldsNative.register(GetObjectInfo_Native);
export const getPicklistValues = ldsNative.register(GetPicklistValues_Native);
export const getPicklistValuesByRecordType = ldsNative.register(
    GetPicklistValuesByRecordType_Native
);
export const getRecord = ldsNative.register(GetRecord_Native);
export const getRecordActions = ldsNative.register(GetRecordActions_Native);
export const getRecordAvatars = ldsNative.register(GetRecordAvatars_Native);
export const getRecordCreateDefaults = ldsNative.register(GetRecordCreateDefaults_Native);
export const getRecordEditActions = ldsNative.register(GetRecordEditActions_Native);
export const getRecordUi = ldsNative.register(GetRecordUi_Native);
export const getRelatedListActions = ldsNative.register(GetRelatedListActions_Native);
export const getRelatedListInfo = ldsNative.register(GetRelatedListInfo_Native);
export const getRelatedListInfos = ldsNative.register(GetRelatedListInfos_Native);
export const getRelatedListRecordActions = ldsNative.register(GetRelatedListRecordActions_Native);
export const getRelatedListRecords = ldsNative.register(GetRelatedListRecords_Native);
export const updateRecordAvatar = ldsNative.register(UpdateRecordAvatar_Native);

// adapters requiring some custom js-side logic for core
export const updateRecord = coreCompliantUpdateRecordFactory(ldsNative);

/* TODO W-6568533 - replace this temporary imperative invocation with wire reform */
export const _getLayout = getLayout;
export const _getLayoutUserState = getLayoutUserState;
export const _getObjectInfo = getObjectInfo;
export const _getRecord = getRecord;
export const _getRecordActions = getRecordActions;
export const _getRecordAvatars = getRecordAvatars;
export const _getRecordUi = getRecordUi;
export const _getRelatedListInfo = getRelatedListInfo;
export const _getRelatedListActions = getRelatedListActions;
export const _getRelatedListInfos = getRelatedListInfos;
export const _getRelatedListRecords = getRelatedListRecords;
export const _getRelatedListRecordActions = getRelatedListRecordActions;

export { MRU };

/** Record Util Pure Functions */
export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
} from '@salesforce-lds-api/uiapi-records';

// TODO W-6863065 - need to figure out how to build updateLayoutUserState adapter
export const updateLayoutUserState = {};

// TODO - W-6572191 - replace with native refresh export
export const refresh = {};

// TODO - W-6531954 - replace with native proxy version
export const getApexInvoker = {};
export const getSObjectValue = {};

// TODO - W-6536698 - replace with native ads bridge
export const adsBridge = {};
