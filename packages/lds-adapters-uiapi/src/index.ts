export { factory as CreateRecord } from './wire/createRecord';
export {
    factory as DeleteRecord,
    deleteRecordNativeAdapterFactory as DeleteRecord_Native,
} from './wire/deleteRecord';
export { factory as GetLayout } from './wire/getLayout';
export { factory as GetLayoutUserState } from './wire/getLayoutUserState';
export {
    factory as GetListUi,
    getListUiNativeAdapterFactory as GetListUi_Native,
    MRU,
} from './wire/getListUi';
export { factory as GetLookupRecords } from './wire/getLookupRecords';
export {
    factory as GetRecord,
    notifyChangeFactory as GetRecordNotifyChange,
} from './wire/getRecord';
export { factory as GetRecordAvatars } from './wire/getRecordAvatars';
export { factory as GetRecordUi } from './wire/getRecordUi';
export { factory as GetPicklistValues } from './wire/getPicklistValues';
export { factory as GetPicklistValuesByRecordType } from './wire/getPicklistValuesByRecordType';
export {
    factory as UpdateRecord,
    ClientOptions as UpdateRecordClientOptions,
} from './wire/updateRecord';
export { factory as UpdateLayoutUserState } from './wire/updateLayoutUserState';
export { factory as UpdateRecordAvatar } from './wire/updateRecordAvatar';
export { factory as GetRecordCreateDefaults } from './wire/getRecordCreateDefaults';

export { createRecordNativeAdapterFactory as CreateRecord_Native } from './generated/adapters/createRecord';
export { getLayoutNativeAdapterFactory as GetLayout_Native } from './generated/adapters/getLayout';
export { getLookupRecordsNativeAdapterFactory as GetLookupRecords_Native } from './generated/adapters/getLookupRecords';
export { getPicklistValuesNativeAdapterFactory as GetPicklistValues_Native } from './generated/adapters/getPicklistValues';
export { getPicklistValuesByRecordTypeNativeAdapterFactory as GetPicklistValuesByRecordType_Native } from './generated/adapters/getPicklistValuesByRecordType';
export {
    getRelatedListInfoAdapterFactory as GetRelatedListInfo,
    getRelatedListInfoNativeAdapterFactory as GetRelatedListInfo_Native,
} from './generated/adapters/getRelatedListInfo';
export { factory as GetRelatedListRecords } from './wire/getRelatedListRecords';
export {
    getLookupActionsAdapterFactory as GetLookupActions,
    getLookupActionsNativeAdapterFactory as GetLookupActions_Native,
} from './generated/adapters/getLookupActions';
export { getRecordNativeAdapterFactory as GetRecord_Native } from './generated/adapters/getRecord';
export {
    getRecordActionsAdapterFactory as GetRecordActions,
    getRecordActionsNativeAdapterFactory as GetRecordActions_Native,
} from './generated/adapters/getRecordActions';
export {
    getRelatedListActionsAdapterFactory as GetRelatedListActions,
    getRelatedListActionsNativeAdapterFactory as GetRelatedListActions_Native,
} from './generated/adapters/getRelatedListActions';
export { getRecordAvatarsNativeAdapterFactory as GetRecordAvatars_Native } from './generated/adapters/getRecordAvatars';
export { getRecordCreateDefaultsNativeAdapterFactory as GetRecordCreateDefaults_Native } from './generated/adapters/getRecordCreateDefaults';
export {
    getRecordEditActionsAdapterFactory as GetRecordEditActions,
    getRecordEditActionsNativeAdapterFactory as GetRecordEditActions_Native,
} from './generated/adapters/getRecordEditActions';
export { getRecordUiNativeAdapterFactory as GetRecordUi_Native } from './generated/adapters/getRecordUi';
export {
    getRelatedListsInfoAdapterFactory as GetRelatedListsInfo,
    getRelatedListsInfoNativeAdapterFactory as GetRelatedListsInfo_Native,
} from './generated/adapters/getRelatedListsInfo';
export {
    getRelatedListCountAdapterFactory as GetRelatedListCount,
    getRelatedListCountNativeAdapterFactory as GetRelatedListCount_Native,
} from './generated/adapters/getRelatedListCount';
export {
    getRelatedListsCountAdapterFactory as GetRelatedListsCount,
    getRelatedListsCountNativeAdapterFactory as GetRelatedListsCount_Native,
} from './generated/adapters/getRelatedListsCount';
export {
    getRelatedListRecordActionsAdapterFactory as GetRelatedListRecordActions,
    getRelatedListRecordActionsNativeAdapterFactory as GetRelatedListRecordActions_Native,
} from './generated/adapters/getRelatedListRecordActions';
export { getRelatedListRecordsNativeAdapterFactory as GetRelatedListRecords_Native } from './generated/adapters/getRelatedListRecords';
export {
    getObjectInfoAdapterFactory as GetObjectInfo,
    getObjectInfoNativeAdapterFactory as GetObjectInfo_Native,
} from './generated/adapters/getObjectInfo';
export {
    getObjectInfosAdapterFactory as GetObjectInfos,
    getObjectInfosNativeAdapterFactory as GetObjectInfos_Native,
} from './generated/adapters/getObjectInfos';
export {
    getObjectInfoDirectoryAdapterFactory as GetObjectInfoDirectory,
    getObjectInfoDirectoryNativeAdapterFactory as GetObjectInfoDirectory_Native,
} from './generated/adapters/getObjectInfoDirectory';
export { getLayoutUserStateNativeAdapterFactory as GetLayoutUserState_Native } from './generated/adapters/getLayoutUserState';
export {
    getAppsAdapterFactory as GetApps,
    getAppsNativeAdapterFactory as GetApps_Native,
} from './generated/adapters/getApps';
export {
    getSelectedAppAdapterFactory as GetSelectedApp,
    getSelectedAppNativeAdapterFactory as GetSelectedApp_Native,
} from './generated/adapters/getSelectedApp';
export {
    updateRecordNativeAdapterFactory as UpdateRecord_Native,
    UpdateRecordConfig,
} from './generated/adapters/updateRecord';
export { updateRecordAvatarNativeAdapterFactory as UpdateRecordAvatar_Native } from './generated/adapters/updateRecordAvatar';
export {
    updateRelatedListInfoAdapterFactory as UpdateRelatedListInfo,
    updateRelatedListInfoNativeAdapterFactory as UpdateRelatedListInfo_Native,
} from './generated/adapters/updateRelatedListInfo';

// Validation Utils
export { untrustedIsObject } from './generated/adapters/adapter-utils';

// This ingestion method needs to be exposed to ingest records coming from the ADS Bridge.
// TODO W-5971944 - remove the ADS bridge and these exports
export {
    RecordRepresentation,
    RecordRepresentationNormalized,
    ingest as ingestRecord,
    keyBuilder as keyBuilderRecord,
    KeyParams as KeyParamsRecord,
} from './generated/types/RecordRepresentation';
export {
    ObjectInfoRepresentation,
    keyBuilder as keyBuilderObjectInfo,
    ingest as ingestObjectInfo,
} from './generated/types/ObjectInfoRepresentation';
export {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from './generated/types/FieldValueRepresentation';

// Exposing those ingestion methods method "@ldsjs/engine" performance tests.
// TODO W-6900152 -  Explore other solutions to see how we can avoid exposing the types out of the module.
export { ingest as ingestRecordUi } from './generated/types/RecordUiRepresentation';

// record-util pure functions
export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
} from './util/records';
