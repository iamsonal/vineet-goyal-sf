jest.resetModules();

(global as any).window = {};
(global as any).__nimbus = { plugins: { lds: {} } };

const mainExports = require('../main');
const LdsMobileExports = require('../lds-mobile/main');

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
    'adsBridge',
    'getRecordNotifyChange',

    /** Utility functions (all pure) */
    'createRecordInputFilteredByEditedFields',
    'generateRecordInputForCreate',
    'generateRecordInputForUpdate',
    'getFieldDisplayValue',
    'getFieldValue',
    'getRecordInput',

    // TODO W-6568533 - replace this temporary imperative invocation with wire reform
    '_getLayout',
    '_getLayoutUserState',
    '_getObjectInfo',
    '_getObjectInfos',
    '_getPicklistValuesByRecordType',
    '_getRecord',
    '_getRecordActions',
    '_getRecordAvatars',
    '_getRecordTemplateClone',
    '_getRecordTemplateCreate',
    '_getRecordUi',
    '_getRelatedListInfo',
    '_getRelatedListsInfo',
    '_getRelatedListActions',
    '_getRelatedListRecords',
    '_getRelatedListRecordActions',
    '_getRelatedListInfoBatch',
    '_getRelatedListRecordsBatch',
].sort();

describe('items exported to core', () => {
    it('should only export whitelisted items', () => {
        expect(Object.keys(mainExports).sort()).toEqual(whiteList);
    });
});

describe('lds-mobile items exported', () => {
    const excludedMobileExports = [
        '_getLayout',
        '_getLayoutUserState',
        '_getObjectInfo',
        '_getObjectInfos',
        '_getPicklistValuesByRecordType',
        '_getRecord',
        '_getRecordActions',
        '_getRecordAvatars',
        '_getRecordTemplateClone',
        '_getRecordTemplateCreate',
        '_getRecordUi',
        '_getRelatedListActions',
        '_getRelatedListInfo',
        '_getRelatedListsInfo',
        '_getRelatedListInfoBatch',
        '_getRelatedListRecordsBatch',
        '_getRelatedListRecordActions',
        '_getRelatedListRecords',
        'adsBridge',
        'generateRecordInputForCreate',
        'generateRecordInputForUpdate',
        'getApexInvoker',
        'getFieldDisplayValue',
        'getFieldValue',
        'getRecordNotifyChange',
        'getSObjectValue',
        'refresh',
        'createRecordInputFilteredByEditedFields',
        'getRecordInput',
    ];
    const extraMobileExports = ['mobileBridge'];

    const expectedMobileExports = whiteList
        .filter(e => !excludedMobileExports.includes(e))
        .concat(extraMobileExports);

    it('should only export whitelisted items', () => {
        expect(Object.keys(LdsMobileExports).sort()).toEqual(expectedMobileExports.sort());
    });

    it('adapters should be registered for bridge access', () => {
        const { mobileBridge } = LdsMobileExports;

        // TODO: W-7399251 - [lds-jscore] support DeleteRecord adapter
        // TODO: W-7399249 - [lds-jscore] support UpdateLayoutUserState adapter
        const unsupported = ['deleteRecord', 'updateLayoutUserState'];
        const symbols = ['MRU'];

        const adapters = expectedMobileExports
            .filter(e => !symbols.includes(e))
            .filter(e => !extraMobileExports.includes(e));

        adapters
            .filter(e => !unsupported.includes(e))
            .forEach(v => {
                {
                    expect(mobileBridge.adapterMap[v]).toBe(LdsMobileExports[v]);
                }
            });
    });
});
