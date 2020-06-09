import {
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
    createWireAdapterConstructor,
} from '@salesforce/lds-karma-config/lds-setup';

import {
    CreateRecord,
    DeleteRecord,
    GetLayout,
    GetLayoutUserState,
    GetListUi,
    GetLookupActions,
    GetLookupRecords,
    GetNavItems,
    GetObjectInfo,
    GetObjectInfos,
    GetPicklistValues,
    GetPicklistValuesByRecordType,
    GetRecord,
    GetRecordActions,
    GetRecordAvatars,
    GetRecordCreateDefaults,
    GetRecordTemplateClone,
    GetRecordTemplateCreate,
    GetRecordEditActions,
    GetRecordNotifyChange,
    GetRecordUi,
    GetRelatedListActions,
    GetRelatedListInfo,
    GetRelatedListInfoBatch,
    GetRelatedListsInfo,
    GetRelatedListCount,
    GetRelatedListsCount,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    GetRelatedListRecordsBatch,
    MRU,
    UpdateLayoutUserState,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateRelatedListInfo,
    GetDuplicateConfiguration,
    GetDuplicates,
} from '@salesforce/lds-adapters-uiapi';

const createRecord = CreateRecord(lds);
const deleteRecord = DeleteRecord(lds);
const getLayout = createWireAdapterConstructor(GetLayout(lds), 'getLayoutConstructor', lds);
const getLayoutUserState = createWireAdapterConstructor(
    GetLayoutUserState(lds),
    'getLayoutUserStateConstructor',
    lds
);
const getListUi = createWireAdapterConstructor(GetListUi(lds), 'getListUiConstructor', lds);
const getLookupActions = createWireAdapterConstructor(
    GetLookupActions(lds),
    'getLookupActionsConstructor',
    lds
);
const getLookupRecords = createWireAdapterConstructor(
    GetLookupRecords(lds),
    'getLookupRecordsConstructor',
    lds
);
const getObjectInfo = createWireAdapterConstructor(
    GetObjectInfo(lds),
    'getObjectInfoConstructor',
    lds
);
const getObjectInfos = createWireAdapterConstructor(
    GetObjectInfos(lds),
    'getObjectInfosConstructor',
    lds
);
const getNavItems = createWireAdapterConstructor(GetNavItems(lds), 'getNavItemsConstructor', lds);
const getPicklistValues = createWireAdapterConstructor(
    GetPicklistValues(lds),
    'getPicklistValuesConstructor',
    lds
);
const getPicklistValuesByRecordType = createWireAdapterConstructor(
    GetPicklistValuesByRecordType(lds),
    'getPicklistValuesByRecordTypeConstructor',
    lds
);

const getRecord = createWireAdapterConstructor(GetRecord(lds), 'getRecordConstructor', lds);
const getRecordActions = createWireAdapterConstructor(
    GetRecordActions(lds),
    'getRecordActionsConstructor',
    lds
);
const getRecordAvatars = createWireAdapterConstructor(
    GetRecordAvatars(lds),
    'getRecordAvatarsConstructor',
    lds
);
const getRecordCreateDefaults = createWireAdapterConstructor(
    GetRecordCreateDefaults(lds),
    'getRecordCreateDefaultsConstructor',
    lds
);
const getRecordTemplateClone = createWireAdapterConstructor(
    GetRecordTemplateClone(lds),
    'getRecordTemplateCloneConstructor',
    lds
);
const getRecordTemplateCreate = createWireAdapterConstructor(
    GetRecordTemplateCreate(lds),
    'getRecordTemplateCreateConstructor',
    lds
);
const getRecordEditActions = createWireAdapterConstructor(
    GetRecordEditActions(lds),
    'getRecordEditActionsConstructor',
    lds
);
const getRecordNotifyChange = GetRecordNotifyChange(lds);
const getRecordUi = createWireAdapterConstructor(GetRecordUi(lds), 'getRecordUiConstructor', lds);
const getRelatedListActions = createWireAdapterConstructor(
    GetRelatedListActions(lds),
    'getRelatedListActionsConstructor',
    lds
);
const getRelatedListInfo = createWireAdapterConstructor(
    GetRelatedListInfo(lds),
    'getRelatedListInfoConstructor',
    lds
);
const getRelatedListInfoBatch = createWireAdapterConstructor(
    GetRelatedListInfoBatch(lds),
    'getRelatedListInfoBatchConstructor',
    lds
);
const getRelatedListsInfo = createWireAdapterConstructor(
    GetRelatedListsInfo(lds),
    'getRelatedListsInfoConstructor',
    lds
);
const getRelatedListCount = createWireAdapterConstructor(
    GetRelatedListCount(lds),
    'getRelatedListCountConstructor',
    lds
);
const getRelatedListsCount = createWireAdapterConstructor(
    GetRelatedListsCount(lds),
    'getRelatedListsCountConstructor',
    lds
);
const getRelatedListRecords = createWireAdapterConstructor(
    GetRelatedListRecords(lds),
    'getRelatedListRecordsConstructor',
    lds
);
const getRelatedListRecordsBatch = createWireAdapterConstructor(
    GetRelatedListRecordsBatch(lds),
    'getRelatedListRecordsBatchConstructor',
    lds
);
const getRelatedListRecordActions = createWireAdapterConstructor(
    GetRelatedListRecordActions(lds),
    'getRelatedListRecordActionsConstructor',
    lds
);

const getDuplicateConfiguration = createWireAdapterConstructor(
    GetDuplicateConfiguration(lds),
    'getDuplicateConfigurationConstructor',
    lds
);
const getDuplicates = createWireAdapterConstructor(
    GetDuplicates(lds),
    'getDuplicatesConstructor',
    lds
);

const updateRecord = UpdateRecord(lds);
const updateRecordAvatar = UpdateRecordAvatar(lds);
const updateLayoutUserState = UpdateLayoutUserState(lds);
const updateRelatedListInfo = UpdateRelatedListInfo(lds);

export {
    // adapters
    createRecord,
    deleteRecord,
    getLayout,
    getLayoutUserState,
    getListUi,
    getLookupActions,
    getLookupRecords,
    getRecordCreateDefaults,
    getRecordTemplateClone,
    getRecordTemplateCreate,
    getPicklistValues,
    getPicklistValuesByRecordType,
    getRecord,
    getRecordActions,
    getRecordAvatars,
    getRecordEditActions,
    getRecordUi,
    getRelatedListActions,
    getRelatedListInfo,
    getRelatedListInfoBatch,
    getRelatedListsInfo,
    getRelatedListCount,
    getRelatedListsCount,
    getRelatedListRecords,
    getRelatedListRecordsBatch,
    getRelatedListRecordActions,
    getObjectInfo,
    getObjectInfos,
    getNavItems,
    updateRecordAvatar,
    MRU,
    updateRecord,
    updateLayoutUserState,
    updateRelatedListInfo,
    getDuplicateConfiguration,
    getDuplicates,
    // notify change functions
    getRecordNotifyChange,
    // lds
    refresh,
    karmaNetworkAdapter,
    store,
};
