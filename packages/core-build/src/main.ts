import * as lds from './lds/main';

/** UI API exports */
export const createRecord = lds.createRecord;
export const deleteRecord = lds.deleteRecord;
export const getLayout = lds.getLayout;
export const getLayoutUserState = lds.getLayoutUserState;
export const getListUi = lds.getListUi;
export const getLookupActions = lds.getLookupActions;
export const getLookupRecords = lds.getLookupRecords;
export const getObjectInfo = lds.getObjectInfo;
export const getObjectInfos = lds.getObjectInfos;
export const getPicklistValues = lds.getPicklistValues;
export const getPicklistValuesByRecordType = lds.getPicklistValuesByRecordType;
export const getRecord = lds.getRecord;
export const getRecordActions = lds.getRecordActions;
export const getRecordAvatars = lds.getRecordAvatars;
export const getRecordCreateDefaults = lds.getRecordCreateDefaults;
export const getRecordUi = lds.getRecordUi;
export const getRelatedListInfo = lds.getRelatedListInfo;
export const MRU = lds.MRU;
export const refresh = lds.refresh;
export const updateLayoutUserState = lds.updateLayoutUserState;
export const updateRecord = lds.updateRecord;
export const updateRecordAvatar = lds.updateRecordAvatar;
export const getRelatedListRecords = lds.getRelatedListRecords;
export const getRecordEditActions = lds.getRecordEditActions;
export const getRelatedListActions = lds.getRelatedListActions;
export const getRelatedListInfos = lds.getRelatedListInfos;
export const getRelatedListsInfo = lds.getRelatedListsInfo;
export const getRelatedListRecordActions = lds.getRelatedListRecordActions;
export const getRelatedListCount = lds.getRelatedListCount;
export const getRelatedListsCount = lds.getRelatedListsCount;

/** Apex exports */
export const getApexInvoker = lds.getApexInvoker;
export const getSObjectValue = lds.getSObjectValue;

/** Record Util Pure Functions */
export const createRecordInputFilteredByEditedFields = lds.createRecordInputFilteredByEditedFields;
export const generateRecordInputForCreate = lds.generateRecordInputForCreate;
export const generateRecordInputForUpdate = lds.generateRecordInputForUpdate;
export const getFieldDisplayValue = lds.getFieldDisplayValue;
export const getFieldValue = lds.getFieldValue;
export const getRecordInput = lds.getRecordInput;

/** Misc exports */
export const adsBridge = lds.adsBridge;

// TODO W-6568533 - replace this temporary imperative invocation with wire reform
export const _getLayout = lds._getLayout;
export const _getLayoutUserState = lds._getLayoutUserState;
export const _getObjectInfo = lds._getObjectInfo;
export const _getRecord = lds._getRecord;
export const _getRecordActions = lds._getRecordActions;
export const _getRecordAvatars = lds._getRecordAvatars;
export const _getRecordUi = lds._getRecordUi;
export const _getRelatedListInfo = lds._getRelatedListInfo;
export const _getRelatedListActions = lds._getRelatedListActions;
export const _getRelatedListInfos = lds._getRelatedListInfos;
export const _getRelatedListRecords = lds._getRelatedListRecords;
export const _getRelatedListRecordActions = lds._getRelatedListRecordActions;
