import * as lds from './lds/main';

/** UI API exports */
export {
    // Adapters
    MRU,
    createRecord,
    deleteRecord,
    getLayout,
    getLayoutUserState,
    getListUi,
    getLookupActions,
    getLookupRecords,
    getObjectInfo,
    getObjectInfos,
    getPicklistValues,
    getPicklistValuesByRecordType,
    getRecord,
    getRecordActions,
    getRecordAvatars,
    getRecordCreateDefaults,
    getRecordTemplateClone,
    getRecordTemplateCreate,
    getRecordUi,
    getRelatedListInfo,
    updateLayoutUserState,
    updateRecord,
    updateRecordAvatar,
    getRelatedListRecords,
    getRecordEditActions,
    getRelatedListActions,
    getRelatedListsActions,
    getRelatedListsInfo,
    getRelatedListRecordActions,
    getRelatedListCount,
    getRelatedListsCount,
    updateRelatedListInfo,
    getRelatedListInfoBatch,
    getRelatedListRecordsBatch,
    getNavItems,
    getDuplicateConfiguration,
    getDuplicates,
    // Record Util Pure Functions
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
    getRecordNotifyChange,
    // TODO W-6568533 - replace this temporary imperative invocation with wire reform
    _getLayout,
    _getLayoutUserState,
    _getObjectInfo,
    _getObjectInfos,
    _getPicklistValuesByRecordType,
    _getRecord,
    _getRecordActions,
    _getRecordAvatars,
    _getRecordTemplateClone,
    _getRecordTemplateCreate,
    _getRecordUi,
    _getRelatedListInfo,
    _getRelatedListsInfo,
    _getRelatedListInfoBatch,
    _getRelatedListActions,
    _getRelatedListsActions,
    _getRelatedListRecords,
    _getRelatedListRecordsBatch,
    _getRelatedListRecordActions,
    _getRelatedListCount,
    _getRelatedListsCount,
} from '@salesforce/lds-adapters-uiapi/sfdc';

/** Apex exports */
export { getApexInvoker, getSObjectValue } from '@salesforce/lds-adapters-apex/sfdc';

/** Connect exports */
export { getCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu/sfdc';

/** Commere exports */
export { getProduct, getProductCategoryPath } from '@salesforce/lds-adapters-commerce-catalog/sfdc';

export { productSearch } from '@salesforce/lds-adapters-commerce-search/sfdc';

export { getProductPrice } from '@salesforce/lds-adapters-commerce-store-pricing/sfdc';

export { refresh } from '@salesforce/lds-bindings';

/** Misc exports */
export const adsBridge = lds.adsBridge;
