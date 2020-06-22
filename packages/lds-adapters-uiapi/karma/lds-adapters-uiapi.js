import { createLDSAdapter, createWireAdapterConstructor } from 'force/ldsBindings';

import {
    CreateRecord,
    DeleteRecord,
    UpdateLayoutUserState,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateRelatedListInfo,
    GetRecordNotifyChange,
    GetLayout,
    GetLookupActions,
    GetRecordActions,
    GetRecordEditActions,
    GetRelatedListsActions,
    GetRelatedListActions,
    GetRelatedListRecordActions,
    GetLayoutUserState,
    GetListUi,
    GetLookupRecords,
    GetRecordCreateDefaults,
    GetRecordTemplateClone,
    GetRecordTemplateCreate,
    GetPicklistValues,
    GetPicklistValuesByRecordType,
    GetRecord,
    GetRecordAvatars,
    GetRecordUi,
    GetRelatedListInfo,
    GetRelatedListInfoBatch,
    GetRelatedListsInfo,
    GetRelatedListCount,
    GetRelatedListsCount,
    GetRelatedListRecords,
    GetRelatedListRecordsBatch,
    GetObjectInfo,
    GetNavItems,
    GetObjectInfos,
    GetDuplicateConfiguration,
    GetDuplicates,
} from '../dist/es/es2018/uiapi-records-service';

export {
    MRU,
    // static functions
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
} from '../dist/es/es2018/uiapi-records-service';

export { refresh } from 'force/ldsBindings';

export const createRecord = createLDSAdapter('createRecord', CreateRecord);
export const deleteRecord = createLDSAdapter('deleteRecord', DeleteRecord);
export const updateRecord = createLDSAdapter('updateRecord', UpdateRecord);
export const updateRecordAvatar = createLDSAdapter('updateRecordAvatar', UpdateRecordAvatar);
export const updateLayoutUserState = createLDSAdapter(
    'updateLayoutUserState',
    UpdateLayoutUserState
);
export const updateRelatedListInfo = createLDSAdapter(
    'updateRelatedListInfo',
    UpdateRelatedListInfo
);

export const getRecordNotifyChange = createLDSAdapter(
    'getRecordUiConstructor',
    GetRecordNotifyChange
);

export const getLayout = createWireAdapterConstructor('getLayout', GetLayout);

export const getLayoutUserState = createWireAdapterConstructor(
    'getLayoutUserState',
    GetLayoutUserState
);

export const getListUi = createWireAdapterConstructor('getListUi', GetListUi);

export const getLookupActions = createWireAdapterConstructor('getLookupActions', GetLookupActions);

export const getLookupRecords = createWireAdapterConstructor('getLookupRecords', GetLookupRecords);

export const getRecordCreateDefaults = createWireAdapterConstructor(
    'getRecordCreateDefaults',
    GetRecordCreateDefaults
);

export const getRecordTemplateClone = createWireAdapterConstructor(
    'getRecordTemplateClone',
    GetRecordTemplateClone
);

export const getRecordTemplateCreate = createWireAdapterConstructor(
    'getRecordTemplateCreate',
    GetRecordTemplateCreate
);

export const getPicklistValues = createWireAdapterConstructor(
    'getPicklistValues',
    GetPicklistValues
);

export const getPicklistValuesByRecordType = createWireAdapterConstructor(
    'getPicklistValuesByRecordType',
    GetPicklistValuesByRecordType
);

export const getRecord = createWireAdapterConstructor('getRecord', GetRecord);

export const getRecordActions = createWireAdapterConstructor('getRecordActions', GetRecordActions);

export const getRecordAvatars = createWireAdapterConstructor('getRecordAvatars', GetRecordAvatars);

export const getRecordEditActions = createWireAdapterConstructor(
    'getRecordEditActions',
    GetRecordEditActions
);

export const getRecordUi = createWireAdapterConstructor('getRecordUi', GetRecordUi);

export const getRelatedListActions = createWireAdapterConstructor(
    'getRelatedListActions',
    GetRelatedListActions
);

export const getRelatedListsActions = createWireAdapterConstructor(
    'getRelatedListsActions',
    GetRelatedListsActions
);

export const getRelatedListInfo = createWireAdapterConstructor(
    'getRelatedListInfo',
    GetRelatedListInfo
);

export const getRelatedListInfoBatch = createWireAdapterConstructor(
    'getRelatedListInfoBatch',
    GetRelatedListInfoBatch
);

export const getRelatedListsInfo = createWireAdapterConstructor(
    'getRelatedListsInfo',
    GetRelatedListsInfo
);

export const getRelatedListCount = createWireAdapterConstructor(
    'getRelatedListCount',
    GetRelatedListCount
);

export const getRelatedListsCount = createWireAdapterConstructor(
    'getRelatedListsCount',
    GetRelatedListsCount
);

export const getRelatedListRecords = createWireAdapterConstructor(
    'getRelatedListRecords',
    GetRelatedListRecords
);

export const getRelatedListRecordsBatch = createWireAdapterConstructor(
    'getRelatedListRecordsBatch',
    GetRelatedListRecordsBatch
);

export const getRelatedListRecordActions = createWireAdapterConstructor(
    'getRelatedListRecordActions',
    GetRelatedListRecordActions
);

export const getObjectInfo = createWireAdapterConstructor('getObjectInfo', GetObjectInfo);

export const getObjectInfos = createWireAdapterConstructor('getObjectInfos', GetObjectInfos);

export const getNavItems = createWireAdapterConstructor('getNavItems', GetNavItems);

export const getDuplicateConfiguration = createWireAdapterConstructor(
    'getDuplicateConfiguration',
    GetDuplicateConfiguration
);

export const getDuplicates = createWireAdapterConstructor('getDuplicates', GetDuplicates);
