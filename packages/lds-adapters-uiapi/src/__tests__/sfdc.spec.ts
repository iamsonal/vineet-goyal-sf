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
