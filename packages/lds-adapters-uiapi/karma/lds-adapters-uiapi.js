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
    name: 'UiApi.getLayout',
});

export const getLayoutUserState = createWireAdapterConstructor(getLayoutUserStateAdapterFactory, {
    name: 'UiApi.getLayoutUserState',
});

export const getListUi = createWireAdapterConstructor(getListUiAdapterFactory, {
    name: 'UiApi.getListUi',
});

export const getListInfoByName = createWireAdapterConstructor(getListInfoByNameAdapterFactory, {
    name: 'UiApi.getListInfoByName',
});

export const getLookupActions = createWireAdapterConstructor(getLookupActionsAdapterFactory, {
    name: 'UiApi.getLookupActions',
});

export const getLookupRecords = createWireAdapterConstructor(getLookupRecordsAdapterFactory, {
    name: 'UiApi.getLookupRecords',
});

export const getRecordCreateDefaults = createWireAdapterConstructor(
    getRecordCreateDefaultsAdapterFactory,
    { name: 'UiApi.getRecordCreateDefaults' }
);

export const getRecordTemplateClone = createWireAdapterConstructor(
    getRecordTemplateCloneAdapterFactory,
    { name: 'UiApi.getRecordTemplateClone' }
);

export const getRecordTemplateCreate = createWireAdapterConstructor(
    getRecordTemplateCreateAdapterFactory,
    { name: 'UiApi.getRecordTemplateCreate' }
);

export const getPicklistValues = createWireAdapterConstructor(getPicklistValuesAdapterFactory, {
    name: 'UiApi.getPicklistValues',
});

export const getPicklistValuesByRecordType = createWireAdapterConstructor(
    getPicklistValuesByRecordTypeAdapterFactory,
    { name: 'UiApi.getPicklistValuesByRecordType' }
);

export const getRecords = createWireAdapterConstructor(getRecordsAdapterFactory, {
    name: 'UiApi.getRecords',
});
export const getRecord = createWireAdapterConstructor(getRecordAdapterFactory, {
    name: 'UiApi.getRecord',
});

export const getRecordActions = createWireAdapterConstructor(getRecordActionsAdapterFactory, {
    name: 'UiApi.getRecordActions',
});

export const getRecordAvatars = createWireAdapterConstructor(getRecordAvatarsAdapterFactory, {
    name: 'UiApi.getRecordAvatars',
});

export const getRecordEditActions = createWireAdapterConstructor(
    getRecordEditActionsAdapterFactory,
    { name: 'UiApi.getRecordEditActions' }
);

export const getRecordUi = createWireAdapterConstructor(getRecordUiAdapterFactory, {
    name: 'UiApi.getRecordUi',
});

export const getRelatedListActions = createWireAdapterConstructor(
    getRelatedListActionsAdapterFactory,
    { name: 'UiApi.getRelatedListActions' }
);

export const getRelatedListsActions = createWireAdapterConstructor(
    getRelatedListsActionsAdapterFactory,
    { name: 'UiApi.getRelatedListsActions' }
);

export const getRelatedListInfo = createWireAdapterConstructor(getRelatedListInfoAdapterFactory, {
    name: 'UiApi.getRelatedListInfo',
});

export const getRelatedListInfoBatch = createWireAdapterConstructor(
    getRelatedListInfoBatchAdapterFactory,
    { name: 'UiApi.getRelatedListInfoBatch' }
);

export const getRelatedListsInfo = createWireAdapterConstructor(getRelatedListsInfoAdapterFactory, {
    name: 'UiApi.getRelatedListsInfo',
});

export const getRelatedListCount = createWireAdapterConstructor(getRelatedListCountAdapterFactory, {
    name: 'UiApi.getRelatedListCount',
});

export const getRelatedListsCount = createWireAdapterConstructor(
    getRelatedListsCountAdapterFactory,
    { name: 'UiApi.getRelatedListsCount' }
);

export const getRelatedListRecords = createWireAdapterConstructor(
    getRelatedListRecordsAdapterFactory,
    { name: 'UiApi.getRelatedListRecords' }
);

export const getRelatedListRecordsBatch = createWireAdapterConstructor(
    getRelatedListRecordsBatchAdapterFactory,
    { name: 'UiApi.getRelatedListRecordsBatch' }
);

export const getRelatedListRecordActions = createWireAdapterConstructor(
    getRelatedListRecordActionsAdapterFactory,
    { name: 'UiApi.getRelatedListRecordActions' }
);

export const getObjectInfo = createWireAdapterConstructor(getObjectInfoAdapterFactory, {
    name: 'UiApi.getObjectInfo',
});

export const getObjectInfos = createWireAdapterConstructor(getObjectInfosAdapterFactory, {
    name: 'UiApi.getObjectInfos',
});

export const getNavItems = createWireAdapterConstructor(getNavItemsAdapterFactory, {
    name: 'UiApi.getNavItems',
});

export const getDuplicateConfiguration = createWireAdapterConstructor(
    getDuplicateConfigurationAdapterFactory,
    { name: 'UiApi.getDuplicateConfiguration' }
);

export const getDuplicates = createWireAdapterConstructor(getDuplicatesAdapterFactory, {
    name: 'UiApi.getDuplicates',
});

export const getObjectCreateActions = createWireAdapterConstructor(
    getObjectCreateActionsAdapterFactory,
    { name: 'UiApi.getObjectCreateActions' }
);

export const getGlobalActions = createWireAdapterConstructor(getGlobalActionsAdapterFactory, {
    name: 'UiApi.getGlobalActions',
});

export const getQuickActionDefaults = createWireAdapterConstructor(
    getQuickActionDefaultsAdapterFactory,
    { name: 'UiApi.getQuickActionDefaults' }
);
