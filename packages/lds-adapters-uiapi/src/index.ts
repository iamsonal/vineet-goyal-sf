export { factory as CreateRecord } from './wire/createRecord';
export { factory as DeleteRecord } from './wire/deleteRecord';
export { factory as GetLayout } from './wire/getLayout';
export { factory as GetLayoutUserState } from './wire/getLayoutUserState';
export { factory as GetListUi, MRU } from './wire/getListUi';
export { factory as GetLookupRecords } from './wire/getLookupRecords';
export {
    factory as GetRecord,
    notifyChangeFactory as GetRecordNotifyChange,
} from './wire/getRecord';
export { factory as GetRecordAvatars } from './wire/getRecordAvatars';
export { factory as GetRecordUi } from './wire/getRecordUi';
export { factory as GetPicklistValues } from './wire/getPicklistValues';
export {
    factory as UpdateRecord,
    ClientOptions as UpdateRecordClientOptions,
} from './wire/updateRecord';
export { factory as UpdateLayoutUserState } from './wire/updateLayoutUserState';
export { factory as UpdateRecordAvatar } from './wire/updateRecordAvatar';
export { factory as GetRecordCreateDefaults } from './wire/getRecordCreateDefaults';

export { getPicklistValuesByRecordTypeAdapterFactory as GetPicklistValuesByRecordType } from './generated/adapters/getPicklistValuesByRecordType';
export { getRelatedListInfoAdapterFactory as GetRelatedListInfo } from './generated/adapters/getRelatedListInfo';
export { getRelatedListRecordsAdapterFactory as GetRelatedListRecords } from './generated/adapters/getRelatedListRecords';
export { getRelatedListRecordsBatchAdapterFactory as GetRelatedListRecordsBatch } from './overrides/adapters/getRelatedListRecordsBatch';
export { getLookupActionsAdapterFactory as GetLookupActions } from './generated/adapters/getLookupActions';
export { getRecordActionsAdapterFactory as GetRecordActions } from './generated/adapters/getRecordActions';
export { getRelatedListActionsAdapterFactory as GetRelatedListActions } from './generated/adapters/getRelatedListActions';
export { getRecordEditActionsAdapterFactory as GetRecordEditActions } from './generated/adapters/getRecordEditActions';
export { getRelatedListsInfoAdapterFactory as GetRelatedListsInfo } from './generated/adapters/getRelatedListsInfo';
export { getRelatedListInfoBatchAdapterFactory as GetRelatedListInfoBatch } from './generated/adapters/getRelatedListInfoBatch';
export { getRelatedListCountAdapterFactory as GetRelatedListCount } from './generated/adapters/getRelatedListCount';
export { getRelatedListsCountAdapterFactory as GetRelatedListsCount } from './generated/adapters/getRelatedListsCount';
export { getRelatedListRecordActionsAdapterFactory as GetRelatedListRecordActions } from './generated/adapters/getRelatedListRecordActions';
export { getObjectInfoAdapterFactory as GetObjectInfo } from './generated/adapters/getObjectInfo';
export { getObjectInfosAdapterFactory as GetObjectInfos } from './generated/adapters/getObjectInfos';
export { getObjectInfoDirectoryAdapterFactory as GetObjectInfoDirectory } from './generated/adapters/getObjectInfoDirectory';
export { getAppsAdapterFactory as GetApps } from './generated/adapters/getApps';
export { getSelectedAppAdapterFactory as GetSelectedApp } from './generated/adapters/getSelectedApp';
export { UpdateRecordConfig } from './generated/adapters/updateRecord';
export { updateRelatedListInfoAdapterFactory as UpdateRelatedListInfo } from './generated/adapters/updateRelatedListInfo';
export { getNavItemsAdapterFactory as GetNavItems } from './generated/adapters/getNavItems';
export { getRecordTemplateCreateAdapterFactory as GetRecordTemplateCreate } from './wire/getRecordTemplateCreate';

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
export { ingest as ingestRelatedListInfo } from './generated/types/RelatedListInfoRepresentation';
export { ingest as ingestRelatedListInfoBatch } from './generated/types/RelatedListInfoBatchRepresentation';
export { ingest as ingestRelatedListRecords } from './generated/types/RelatedListRecordCollectionRepresentation';
export { ingest as ingestRelatedListRecordsBatch } from './generated/types/RelatedListRecordCollectionBatchRepresentation';

// record-util pure functions
export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
} from './util/records';
