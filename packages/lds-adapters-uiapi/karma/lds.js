import {
    karmaNetworkAdapter,
    lds,
    register,
    refresh,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import {
    CreateRecord,
    DeleteRecord,
    GetLayout,
    GetLayoutUserState,
    GetListUi,
    GetLookupActions,
    GetLookupRecords,
    GetObjectInfo,
    GetPicklistValues,
    GetPicklistValuesByRecordType,
    GetRecord,
    GetRecordActions,
    GetRecordAvatars,
    GetRecordCreateDefaults,
    GetRecordEditActions,
    GetRecordUi,
    GetRelatedListActions,
    GetRelatedListInfo,
    GetRelatedListsInfo,
    GetRelatedListCount,
    GetRelatedListsCount,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    MRU,
    UpdateLayoutUserState,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateRelatedListInfo,
} from '@salesforce/lds-adapters-uiapi';

const createRecord = CreateRecord(lds);
const deleteRecord = DeleteRecord(lds);
const getLayout = register(lds, wireService, GetLayout(lds));
const getLayoutUserState = register(lds, wireService, GetLayoutUserState(lds));
const getListUi = register(lds, wireService, GetListUi(lds));
const getLookupActions = register(lds, wireService, GetLookupActions(lds));
const getLookupRecords = register(lds, wireService, GetLookupRecords(lds));
const getObjectInfo = register(lds, wireService, GetObjectInfo(lds));
const getPicklistValues = register(lds, wireService, GetPicklistValues(lds));
const getPicklistValuesByRecordType = register(
    lds,
    wireService,
    GetPicklistValuesByRecordType(lds)
);
const getRecord = register(lds, wireService, GetRecord(lds));
const getRecordActions = register(lds, wireService, GetRecordActions(lds));
const getRecordAvatars = register(lds, wireService, GetRecordAvatars(lds));
const getRecordCreateDefaults = register(lds, wireService, GetRecordCreateDefaults(lds));
const getRecordEditActions = register(lds, wireService, GetRecordEditActions(lds));
const getRecordUi = register(lds, wireService, GetRecordUi(lds));
const getRelatedListActions = register(lds, wireService, GetRelatedListActions(lds));
const getRelatedListInfo = register(lds, wireService, GetRelatedListInfo(lds));
const getRelatedListsInfo = register(lds, wireService, GetRelatedListsInfo(lds));
const getRelatedListCount = register(lds, wireService, GetRelatedListCount(lds));
const getRelatedListsCount = register(lds, wireService, GetRelatedListsCount(lds));
const getRelatedListRecords = register(lds, wireService, GetRelatedListRecords(lds));
const getRelatedListRecordActions = register(lds, wireService, GetRelatedListRecordActions(lds));
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
    getPicklistValues,
    getPicklistValuesByRecordType,
    getRecord,
    getRecordActions,
    getRecordAvatars,
    getRecordEditActions,
    getRecordUi,
    getRelatedListActions,
    getRelatedListInfo,
    getRelatedListsInfo,
    getRelatedListCount,
    getRelatedListsCount,
    getRelatedListRecords,
    getRelatedListRecordActions,
    getObjectInfo,
    updateRecordAvatar,
    MRU,
    updateRecord,
    updateLayoutUserState,
    updateRelatedListInfo,
    // lds
    refresh,
    karmaNetworkAdapter,
    store,
};
