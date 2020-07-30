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
    getRecordEditActionsAdapterFactory,
    getRelatedListsActionsAdapterFactory,
    getRelatedListActionsAdapterFactory,
    getRelatedListRecordActionsAdapterFactory,
    getLayoutUserStateAdapterFactory,
    getListUiAdapterFactory,
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

export const getLayout = createWireAdapterConstructor('getLayout', getLayoutAdapterFactory);

export const getLayoutUserState = createWireAdapterConstructor(
    'getLayoutUserState',
    getLayoutUserStateAdapterFactory
);

export const getListUi = createWireAdapterConstructor('getListUi', getListUiAdapterFactory);

export const getLookupActions = createWireAdapterConstructor(
    'getLookupActions',
    getLookupActionsAdapterFactory
);

export const getLookupRecords = createWireAdapterConstructor(
    'getLookupRecords',
    getLookupRecordsAdapterFactory
);

export const getRecordCreateDefaults = createWireAdapterConstructor(
    'getRecordCreateDefaults',
    getRecordCreateDefaultsAdapterFactory
);

export const getRecordTemplateClone = createWireAdapterConstructor(
    'getRecordTemplateClone',
    getRecordTemplateCloneAdapterFactory
);

export const getRecordTemplateCreate = createWireAdapterConstructor(
    'getRecordTemplateCreate',
    getRecordTemplateCreateAdapterFactory
);

export const getPicklistValues = createWireAdapterConstructor(
    'getPicklistValues',
    getPicklistValuesAdapterFactory
);

export const getPicklistValuesByRecordType = createWireAdapterConstructor(
    'getPicklistValuesByRecordType',
    getPicklistValuesByRecordTypeAdapterFactory
);

export const getRecord = createWireAdapterConstructor('getRecord', getRecordAdapterFactory);

export const getRecordActions = createWireAdapterConstructor(
    'getRecordActions',
    getRecordActionsAdapterFactory
);

export const getRecordAvatars = createWireAdapterConstructor(
    'getRecordAvatars',
    getRecordAvatarsAdapterFactory
);

export const getRecordEditActions = createWireAdapterConstructor(
    'getRecordEditActions',
    getRecordEditActionsAdapterFactory
);

export const getRecordUi = createWireAdapterConstructor('getRecordUi', getRecordUiAdapterFactory);

export const getRelatedListActions = createWireAdapterConstructor(
    'getRelatedListActions',
    getRelatedListActionsAdapterFactory
);

export const getRelatedListsActions = createWireAdapterConstructor(
    'getRelatedListsActions',
    getRelatedListsActionsAdapterFactory
);

export const getRelatedListInfo = createWireAdapterConstructor(
    'getRelatedListInfo',
    getRelatedListInfoAdapterFactory
);

export const getRelatedListInfoBatch = createWireAdapterConstructor(
    'getRelatedListInfoBatch',
    getRelatedListInfoBatchAdapterFactory
);

export const getRelatedListsInfo = createWireAdapterConstructor(
    'getRelatedListsInfo',
    getRelatedListsInfoAdapterFactory
);

export const getRelatedListCount = createWireAdapterConstructor(
    'getRelatedListCount',
    getRelatedListCountAdapterFactory
);

export const getRelatedListsCount = createWireAdapterConstructor(
    'getRelatedListsCount',
    getRelatedListsCountAdapterFactory
);

export const getRelatedListRecords = createWireAdapterConstructor(
    'getRelatedListRecords',
    getRelatedListRecordsAdapterFactory
);

export const getRelatedListRecordsBatch = createWireAdapterConstructor(
    'getRelatedListRecordsBatch',
    getRelatedListRecordsBatchAdapterFactory
);

export const getRelatedListRecordActions = createWireAdapterConstructor(
    'getRelatedListRecordActions',
    getRelatedListRecordActionsAdapterFactory
);

export const getObjectInfo = createWireAdapterConstructor(
    'getObjectInfo',
    getObjectInfoAdapterFactory
);

export const getObjectInfos = createWireAdapterConstructor(
    'getObjectInfos',
    getObjectInfosAdapterFactory
);

export const getNavItems = createWireAdapterConstructor('getNavItems', getNavItemsAdapterFactory);

export const getDuplicateConfiguration = createWireAdapterConstructor(
    'getDuplicateConfiguration',
    getDuplicateConfigurationAdapterFactory
);

export const getDuplicates = createWireAdapterConstructor(
    'getDuplicates',
    getDuplicatesAdapterFactory
);
