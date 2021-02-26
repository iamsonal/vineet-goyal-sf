import { createLDSAdapter, createWireAdapterConstructor } from 'force/ldsBindings';

import {
    createRecordAdapterFactory,
    deleteRecordAdapterFactory,
    updateLayoutUserStateAdapterFactory,
    updateRecordAdapterFactory,
    updateRecordAvatarAdapterFactory,
    updateRelatedListInfoAdapterFactory,
    GetRecordNotifyChange,
    getLayoutAdapterFactory,
    getLookupActionsAdapterFactory,
    getRecordActionsAdapterFactory,
    getGlobalActionsAdapterFactory,
    getQuickActionDefaultsAdapterFactory,
    getRecordEditActionsAdapterFactory,
    getRecordsAdapterFactory,
    getObjectCreateActionsAdapterFactory,
    getRelatedListsActionsAdapterFactory,
    getRelatedListActionsAdapterFactory,
    getRelatedListRecordActionsAdapterFactory,
    getLayoutUserStateAdapterFactory,
    getListUiAdapterFactory,
    getListInfoByNameAdapterFactory,
    getLookupRecordsAdapterFactory,
    getRecordCreateDefaultsAdapterFactory,
    getRecordTemplateCloneAdapterFactory,
    getRecordTemplateCreateAdapterFactory,
    getPicklistValuesAdapterFactory,
    getPicklistValuesByRecordTypeAdapterFactory,
    getRecordAdapterFactory,
    getRecordAvatarsAdapterFactory,
    getRecordUiAdapterFactory,
    getRelatedListInfoAdapterFactory,
    getRelatedListInfoBatchAdapterFactory,
    getRelatedListsInfoAdapterFactory,
    getRelatedListCountAdapterFactory,
    getRelatedListsCountAdapterFactory,
    getRelatedListRecordsAdapterFactory,
    getRelatedListRecordsBatchAdapterFactory,
    getObjectInfoAdapterFactory,
    getNavItemsAdapterFactory,
    getObjectInfosAdapterFactory,
    getDuplicateConfigurationAdapterFactory,
    getDuplicatesAdapterFactory,
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

export const createRecord = createLDSAdapter('createRecord', createRecordAdapterFactory);
export const deleteRecord = createLDSAdapter('deleteRecord', deleteRecordAdapterFactory);
export const updateRecord = createLDSAdapter('updateRecord', updateRecordAdapterFactory);
export const updateRecordAvatar = createLDSAdapter(
    'updateRecordAvatar',
    updateRecordAvatarAdapterFactory
);
export const updateLayoutUserState = createLDSAdapter(
    'updateLayoutUserState',
    updateLayoutUserStateAdapterFactory
);
export const updateRelatedListInfo = createLDSAdapter(
    'updateRelatedListInfo',
    updateRelatedListInfoAdapterFactory
);

export const getRecordNotifyChange = createLDSAdapter(
    'getRecordUiConstructor',
    GetRecordNotifyChange
);

export const getLayout = createWireAdapterConstructor(getLayoutAdapterFactory, {
    name: 'getLayout',
});

export const getLayoutUserState = createWireAdapterConstructor(getLayoutUserStateAdapterFactory, {
    name: ' getLayoutUserState',
});

export const getListUi = createWireAdapterConstructor(getListUiAdapterFactory, {
    name: 'getListUi',
});

export const getListInfoByName = createWireAdapterConstructor(getListInfoByNameAdapterFactory, {
    name: 'getListInfoByName',
});

export const getLookupActions = createWireAdapterConstructor(getLookupActionsAdapterFactory, {
    name: 'getLookupActions',
});

export const getLookupRecords = createWireAdapterConstructor(getLookupRecordsAdapterFactory, {
    name: 'getLookupRecords',
});

export const getRecordCreateDefaults = createWireAdapterConstructor(
    getRecordCreateDefaultsAdapterFactory,
    { name: 'getRecordCreateDefaults' }
);

export const getRecordTemplateClone = createWireAdapterConstructor(
    getRecordTemplateCloneAdapterFactory,
    { name: 'getRecordTemplateClone' }
);

export const getRecordTemplateCreate = createWireAdapterConstructor(
    getRecordTemplateCreateAdapterFactory,
    { name: 'getRecordTemplateCreate' }
);

export const getPicklistValues = createWireAdapterConstructor(getPicklistValuesAdapterFactory, {
    name: 'getPicklistValues',
});

export const getPicklistValuesByRecordType = createWireAdapterConstructor(
    getPicklistValuesByRecordTypeAdapterFactory,
    { name: 'getPicklistValuesByRecordType' }
);

export const getRecords = createWireAdapterConstructor(getRecordsAdapterFactory, {
    name: 'getRecords',
});
export const getRecord = createWireAdapterConstructor(getRecordAdapterFactory, {
    name: 'getRecord',
});

export const getRecordActions = createWireAdapterConstructor(getRecordActionsAdapterFactory, {
    name: 'getRecordActions',
});

export const getRecordAvatars = createWireAdapterConstructor(getRecordAvatarsAdapterFactory, {
    name: 'getRecordAvatars',
});

export const getRecordEditActions = createWireAdapterConstructor(
    getRecordEditActionsAdapterFactory,
    { name: 'getRecordEditActions' }
);

export const getRecordUi = createWireAdapterConstructor(getRecordUiAdapterFactory, {
    name: 'getRecordUi',
});

export const getRelatedListActions = createWireAdapterConstructor(
    getRelatedListActionsAdapterFactory,
    { name: 'getRelatedListActions' }
);

export const getRelatedListsActions = createWireAdapterConstructor(
    getRelatedListsActionsAdapterFactory,
    { name: 'getRelatedListsActions' }
);

export const getRelatedListInfo = createWireAdapterConstructor(getRelatedListInfoAdapterFactory, {
    name: 'getRelatedListInfo',
});

export const getRelatedListInfoBatch = createWireAdapterConstructor(
    getRelatedListInfoBatchAdapterFactory,
    { name: 'getRelatedListInfoBatch' }
);

export const getRelatedListsInfo = createWireAdapterConstructor(getRelatedListsInfoAdapterFactory, {
    name: 'getRelatedListsInfo',
});

export const getRelatedListCount = createWireAdapterConstructor(getRelatedListCountAdapterFactory, {
    name: 'getRelatedListCount',
});

export const getRelatedListsCount = createWireAdapterConstructor(
    getRelatedListsCountAdapterFactory,
    { name: 'getRelatedListsCount' }
);

export const getRelatedListRecords = createWireAdapterConstructor(
    getRelatedListRecordsAdapterFactory,
    { name: 'getRelatedListRecords' }
);

export const getRelatedListRecordsBatch = createWireAdapterConstructor(
    getRelatedListRecordsBatchAdapterFactory,
    { name: 'getRelatedListRecordsBatch' }
);

export const getRelatedListRecordActions = createWireAdapterConstructor(
    getRelatedListRecordActionsAdapterFactory,
    { name: 'getRelatedListRecordActions' }
);

export const getObjectInfo = createWireAdapterConstructor(getObjectInfoAdapterFactory, {
    name: 'getObjectInfo',
});

export const getObjectInfos = createWireAdapterConstructor(getObjectInfosAdapterFactory, {
    name: 'getObjectInfos',
});

export const getNavItems = createWireAdapterConstructor(getNavItemsAdapterFactory, {
    name: 'getNavItems',
});

export const getDuplicateConfiguration = createWireAdapterConstructor(
    getDuplicateConfigurationAdapterFactory,
    { name: 'getDuplicateConfiguration' }
);

export const getDuplicates = createWireAdapterConstructor(getDuplicatesAdapterFactory, {
    name: 'getDuplicates',
});

export const getObjectCreateActions = createWireAdapterConstructor(
    getObjectCreateActionsAdapterFactory,
    { name: 'getObjectCreateActions' }
);

export const getGlobalActions = createWireAdapterConstructor(getGlobalActionsAdapterFactory, {
    name: 'getGlobalActions',
});

export const getQuickActionDefaults = createWireAdapterConstructor(
    getQuickActionDefaultsAdapterFactory,
    { name: 'getQuickActionDefaults' }
);
