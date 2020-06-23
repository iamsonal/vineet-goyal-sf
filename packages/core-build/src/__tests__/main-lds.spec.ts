import * as mainExports from '../main';

describe('Main exports', () => {
    [
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
        'getRecordEditActions',
        'getRecordNotifyChange',
        'getRecordUi',
        'getRelatedListRecordActions',
        'refresh',
        'updateLayoutUserState',
        'updateRecord',
        'updateRecordAvatar',
        'MRU',
        'getRecordCreateDefaults',
        'getLayoutUserState',
        'getRelatedListInfo',
        'updateRelatedListInfo',
        'getRelatedListsInfo',
        'getRelatedListRecords',
        'getRelatedListCount',
        'getRelatedListsCount',
        'getApexInvoker',
        'getRelatedListInfoBatch',
        'getRelatedListRecordsBatch',
        'getNavItems',
        'getDuplicateConfiguration',
        'getDuplicates',
    ].forEach(moduleName => {
        it(`should export ${moduleName} from lds`, () => {
            expect((mainExports as any)[moduleName]).toBeDefined();
        });
    });

    // pure functions
    [
        'createRecordInputFilteredByEditedFields',
        'generateRecordInputForCreate',
        'generateRecordInputForUpdate',
        'getFieldDisplayValue',
        'getFieldValue',
        'getRecordInput',
        'getSObjectValue',
    ].forEach(moduleName => {
        it(`should export ${moduleName} from lds`, () => {
            expect((mainExports as any)[moduleName]).toBeDefined();
        });
    });
});
