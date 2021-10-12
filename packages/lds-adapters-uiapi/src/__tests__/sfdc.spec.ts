import * as uiapiExports from '../sfdc';
import ldsEngineCreator from 'force/ldsEngineCreator';

beforeAll(() => {
    ldsEngineCreator();
});

describe('SFDC exports', () => {
    describe('items exported to core', () => {
        /**
         * This export allowlist ensures that we have the minimum amount of exports
         * for LDS. An approved pull request/code review by David Turissini (@davidturissini) or
         * Kevin Venkiteswaran (@kevinv11n) is required before merging ANY changes to this list.
         */
        const allowList = [
            /** UI API exports */
            'createRecord',
            'createIngestRecordWithFields',
            'deleteRecord',
            'getLayout',
            'getLayoutUserState',
            'getListUi',
            'getListInfoByName',
            'getLookupActions',
            'getLookupRecords',
            'getObjectInfo',
            'getObjectInfos',
            'getPicklistValues',
            'getPicklistValuesByRecordType',
            'getRecord',
            'getRecords',
            'getRecordActions',
            'getGlobalActions',
            'getQuickActionDefaults',
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
            'getObjectCreateActions',
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
            'refresh',

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

            /** Configuration object */
            'configuration',

            /** instrumentation object */
            'instrument',
            'LdsUiapiInstrumentation',

            /** imperative GET adapters */
            'getDuplicateConfiguration_imperative',
            'getDuplicates_imperative',
            'getGlobalActions_imperative',
            'getLayout_imperative',
            'getLayoutUserState_imperative',
            'getListInfoByName_imperative',
            'getListUi_imperative',
            'getLookupActions_imperative',
            'getLookupRecords_imperative',
            'getNavItems_imperative',
            'getObjectCreateActions_imperative',
            'getObjectInfo_imperative',
            'getObjectInfos_imperative',
            'getPicklistValues_imperative',
            'getPicklistValuesByRecordType_imperative',
            'getQuickActionDefaults_imperative',
            'getRecord_imperative',
            'getRecordActions_imperative',
            'getRecordAvatars_imperative',
            'getRecordCreateDefaults_imperative',
            'getRecordEditActions_imperative',
            'getRecordTemplateClone_imperative',
            'getRecordTemplateCreate_imperative',
            'getRecordUi_imperative',
            'getRecords_imperative',
            'getRelatedListActions_imperative',
            'getRelatedListCount_imperative',
            'getRelatedListInfo_imperative',
            'getRelatedListInfoBatch_imperative',
            'getRelatedListRecordActions_imperative',
            'getRelatedListRecords_imperative',
            'getRelatedListRecordsBatch_imperative',
            'getRelatedListsActions_imperative',
            'getRelatedListsCount_imperative',
            'getRelatedListsInfo_imperative',

            // cache policies
            'CachePolicy',
            'CachePolicyCacheAndNetwork',
            'CachePolicyCacheThenNetwork',
            'CachePolicyNoCache',
            'CachePolicyOnlyIfCached',
            'CachePolicyStaleWhileRevalidate',
            'CachePolicyValidAt',
        ].sort();

        it('should only export allowlisted items', () => {
            expect(Object.keys(uiapiExports).sort()).toEqual(allowList);
        });
    });
});

jest.mock('../main', () => {
    const mockAdapter = () => {
        return {
            then: () => null,
        };
    };
    const spies = {
        updateLayoutUserStateSpy: jest.fn(mockAdapter),
        updateRelatedListInfoSpy: jest.fn(mockAdapter),
    };

    return {
        ...jest.requireActual('../main'),
        updateLayoutUserStateAdapterFactory: () => spies.updateLayoutUserStateSpy,
        updateRelatedListInfoAdapterFactory: () => spies.updateRelatedListInfoSpy,
        __spies: spies,
    };
});

import { __spies as adapterFactorySpies } from '../main';

describe('Custom Adapters', () => {
    describe('updateLayoutUserState', () => {
        it('should return promise that resolves to undefined', () => {
            adapterFactorySpies.updateLayoutUserStateSpy.mockResolvedValueOnce({});

            return expect(
                uiapiExports.updateLayoutUserState(
                    'Opportunity',
                    '00x000000000000017',
                    'Full',
                    'View',
                    {}
                )
            ).resolves.toBeUndefined();
        });
    });

    describe('updateRelatedListInfo', () => {
        it('should return promise that resolves to data', () => {
            const snapshotData = {};
            adapterFactorySpies.updateRelatedListInfoSpy.mockResolvedValueOnce({
                data: snapshotData,
            });

            return expect(
                uiapiExports.updateRelatedListInfo({
                    parentObjectApiName: '',
                    relatedListId: '',
                    orderedByInfo: [],
                    userPreferences: {
                        columnWidths: {},
                        columnWrap: {},
                    },
                })
            ).resolves.toBe(snapshotData);
        });
    });
});
