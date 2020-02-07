describe('Main exports', () => {
    const mainExports = require('../main');
    const ldsExports = require('../lds/main');

    [
        'createRecord',
        'deleteRecord',
        'getLayout',
        'getLayoutUserState',
        'getListUi',
        'getLookupActions',
        'getLookupRecords',
        'getObjectInfo',
        'getPicklistValues',
        'getPicklistValuesByRecordType',
        'getRecord',
        'getRecordActions',
        'getRecordAvatars',
        'getRecordEditActions',
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
        'getRelatedListInfos',
        'getRelatedListsInfo',
        'getRelatedListRecords',
        'getRelatedListCount',
        'getRelatedListsCount',
        'getApexInvoker',
        'getSObjectValue',
    ].forEach(moduleName => {
        it(`should export ${moduleName} from lds`, () => {
            expect((mainExports as any)[moduleName]).toBe((ldsExports as any)[moduleName]);
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
    ].forEach(moduleName => {
        it(`should export ${moduleName} from lds`, () => {
            expect((mainExports as any)[moduleName]).toBe((ldsExports as any)[moduleName]);
        });
    });
});
