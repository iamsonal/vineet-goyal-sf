jest.resetModules();

(global as any).window = {};

const mainExports = require('../main');
const LdsNativeProxyExports = require('../ldsNativeProxy/main');

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
    'getPicklistValues',
    'getPicklistValuesByRecordType',
    'getRecord',
    'getRecordActions',
    'getRecordAvatars',
    'getRecordCreateDefaults',
    'getRecordUi',
    'getRelatedListActions',
    'getRelatedListInfo',
    'MRU',
    'refresh',
    'updateLayoutUserState',
    'updateRecord',
    'updateRecordAvatar',
    'getRecordEditActions',
    'getRelatedListInfos',
    'getRelatedListRecords',
    'getRelatedListRecordActions',

    /** Apex exports */
    'getApexInvoker',
    'getSObjectValue',

    /** Misc exports */
    'adsBridge',

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
    '_getRecord',
    '_getRecordActions',
    '_getRecordAvatars',
    '_getRecordUi',
].sort();

describe('items exported to core', () => {
    it('should only export whitelisted items', () => {
        expect(whiteList).toEqual(Object.keys(mainExports).sort());
    });
});

describe('ldsNativeProxy items exported to core', () => {
    it('should only export whitelisted items', () => {
        expect(whiteList).toEqual(Object.keys(LdsNativeProxyExports).sort());
    });
});
