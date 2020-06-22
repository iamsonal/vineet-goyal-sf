import * as uiapiExports from '../sfdc';

describe('SFDC exports', () => {
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
        'getRelatedListInfoBatch',
        'getRelatedListRecordsBatch',
        'getNavItems',
        'getDuplicateConfiguration',
        'getDuplicates',
    ].forEach(adapterName => {
        it(`should export ${adapterName} from sfdc uiapi adapters module`, () => {
            expect((uiapiExports as any)[adapterName]).toBeDefined();
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
    ].forEach(functionName => {
        it(`should export ${functionName} from sfdc uiapi adapters module`, () => {
            expect((uiapiExports as any)[functionName]).toBeDefined();
        });
    });

    describe('items exported to core', () => {
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

            /** Misc exports */
            'getRecordNotifyChange',

            /** Utility functions (all pure) */
            'createRecordInputFilteredByEditedFields',
            'generateRecordInputForCreate',
            'generateRecordInputForUpdate',
            'getFieldDisplayValue',
            'getFieldValue',
            'getRecordInput',

            /** temporary exports for ADS bridge */
            'ingestObjectInfo',
            'ingestRecord',
            'keyBuilderObjectInfo',
            'keyBuilderRecord',

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
            '_getRelatedListsActions',
            '_getRelatedListRecords',
            '_getRelatedListRecordActions',
            '_getRelatedListInfoBatch',
            '_getRelatedListRecordsBatch',
            '_getRelatedListCount',
            '_getRelatedListsCount',
        ].sort();

        it('should only export whitelisted items', () => {
            expect(Object.keys(uiapiExports).sort()).toEqual(whiteList);
        });
    });
});
