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
        'getSObjectValue',
    ].forEach(moduleName => {
        it(`should export ${moduleName} from lds`, () => {
            expect((mainExports as any)[moduleName]).toBe((ldsExports as any)[moduleName]);
        });
    });
});
