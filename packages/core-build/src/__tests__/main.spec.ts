jest.resetModules();

(global as any).window = {};
(global as any).__nimbus = { plugins: { lds: {} } };

const mainExports = require('../main');

/**
 * This export whitelist ensures that we have the minimum amount of exports
 * for LDS. An approved pull request/code review by David Turissini (@davidturissini) or
 * Kevin Venkiteswaran (@kevinv11n) is required before merging ANY changes to this list.
 */
const whiteList = [
    /** UI API exports */
    'createRecord',
    'deleteRecord',
    'getLayout',
    'getLayoutUserState',
    'getListUi',
    'getLookupActions',
    'getLookupRecords',
    'getObjectInfo',
    'getObjectInfos',
    'getPicklistValues',
    'getPicklistValuesByRecordType',
    'getRecord',
    'getRecordActions',
    'getRecordAvatars',
    'getRecordCreateDefaults',
    'getRecordTemplateClone',
    'getRecordTemplateCreate',
    'getRecordUi',
    'getRelatedListActions',
    'getRelatedListsActions',
    'getRelatedListInfo',
    'MRU',
    'refresh',
    'updateLayoutUserState',
    'updateRecord',
    'updateRecordAvatar',
    'getRecordEditActions',
    'getRelatedListsInfo',
    'updateRelatedListInfo',
    'getRelatedListRecords',
    'getRelatedListRecordActions',
    'getRelatedListCount',
    'getRelatedListsCount',
    'getRelatedListInfoBatch',
    'getRelatedListRecordsBatch',
    'getNavItems',
    'getDuplicateConfiguration',
    'getDuplicates',

    /** Apex exports */
    'getApexInvoker',
    'getSObjectValue',

    /** Connect exports */
    'getCommunityNavigationMenu',

    /** Commerce exports */
    'getProduct',
    'getProductCategoryPath',
    'getProductPrice',
    'productSearch',

    /** Misc exports */
    'getRecordNotifyChange',

    /** Utility functions (all pure) */
    'createRecordInputFilteredByEditedFields',
    'generateRecordInputForCreate',
    'generateRecordInputForUpdate',
    'getFieldDisplayValue',
    'getFieldValue',
    'getRecordInput',
].sort();

describe('items exported to core', () => {
    it('should only export whitelisted items', () => {
        expect(Object.keys(mainExports).sort()).toEqual(whiteList);
    });
});
