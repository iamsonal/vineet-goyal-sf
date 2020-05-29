import {
    _getRecord,
    _getRecordActions,
    _getLayout,
    _getObjectInfo,
    createRecord,
    updateRecord,
    updateRecordAvatar,
    refresh,
    updateLayoutUserState,
    _getRelatedListInfo,
    _getRelatedListsInfo,
    _getRelatedListActions,
    _getRelatedListCount,
    _getRelatedListsCount,
    _getRelatedListInfoBatch,
    _getRelatedListRecords,
    _getRelatedListRecordActions,
    _getRelatedListRecordsBatch,
} from '../main';

jest.mock('@salesforce/lds-adapters-uiapi', () => {
    const mockAdapter = () => {
        return {
            then: () => null,
        };
    };

    const spies = {
        getRecordSpy: jest.fn(mockAdapter),
        getRecordActionsSpy: jest.fn(mockAdapter),
        getLayoutSpy: jest.fn(mockAdapter),
        getObjectInfoSpy: jest.fn(mockAdapter),
        updateLayoutUserStateSpy: jest.fn(mockAdapter),
        createRecordSpy: jest.fn(mockAdapter),
        updateRecordSpy: jest.fn(mockAdapter),
        updateRecordAvatarSpy: jest.fn(mockAdapter),
        getRelatedListInfoSpy: jest.fn(mockAdapter),
        getRelatedListsInfoSpy: jest.fn(mockAdapter),
        getRelatedListActionsSpy: jest.fn(mockAdapter),
        getRelatedListCountSpy: jest.fn(mockAdapter),
        getRelatedListsCountSpy: jest.fn(mockAdapter),
        getRelatedListInfoBatchSpy: jest.fn(mockAdapter),
        getRelatedListRecordsSpy: jest.fn(mockAdapter),
        getRelatedListRecordActionsSpy: jest.fn(mockAdapter),
        getRelatedListRecordsBatchSpy: jest.fn(mockAdapter),
    };

    return {
        ...jest.requireActual('@salesforce/lds-adapters-uiapi'),
        GetRecord: () => spies.getRecordSpy,
        GetRecordActions: () => spies.getRecordActionsSpy,
        GetLayout: () => spies.getLayoutSpy,
        GetObjectInfo: () => spies.getObjectInfoSpy,
        UpdateLayoutUserState: () => spies.updateLayoutUserStateSpy,
        CreateRecord: () => spies.createRecordSpy,
        UpdateRecord: () => spies.updateRecordSpy,
        UpdateRecordAvatar: () => spies.updateRecordAvatarSpy,
        GetRelatedListInfo: () => spies.getRelatedListInfoSpy,
        GetRelatedListsInfo: () => spies.getRelatedListsInfoSpy,
        GetRelatedListActions: () => spies.getRelatedListActionsSpy,
        GetRelatedListCount: () => spies.getRelatedListCountSpy,
        GetRelatedListsCount: () => spies.getRelatedListsCountSpy,
        GetRelatedListInfoBatch: () => spies.getRelatedListInfoBatchSpy,
        GetRelatedListRecords: () => spies.getRelatedListRecordsSpy,
        GetRelatedListRecordActions: () => spies.getRelatedListRecordActionsSpy,
        GetRelatedListRecordsBatch: () => spies.getRelatedListRecordsBatchSpy,
        __spies: spies,
    };
});

jest.mock('@ldsjs/lwc-lds', () => {
    const spies = {
        bindWireRefreshSpy: jest.fn(),
    };

    return {
        ...jest.requireActual('@ldsjs/lwc-lds'),
        bindWireRefresh: () => spies.bindWireRefreshSpy,
        __spies: spies,
    };
});

jest.mock('instrumentation/service', () => {
    const spies = {
        cacheStatsLogHitsSpy: jest.fn(),
        cacheStatsLogMissesSpy: jest.fn(),
        counterIncrementSpy: jest.fn(),
        percentileUpdateSpy: jest.fn(),
        timerAddDurationSpy: jest.fn(),
    };

    return {
        counter: () => ({
            increment: spies.counterIncrementSpy,
        }),
        percentileHistogram: () => ({
            update: spies.percentileUpdateSpy,
        }),
        registerCacheStats: () => ({
            logHits: spies.cacheStatsLogHitsSpy,
            logMisses: spies.cacheStatsLogMissesSpy,
        }),
        registerPeriodicLogger: jest.fn(),
        registerPlugin: jest.fn(),
        timer: () => ({
            addDuration: spies.timerAddDurationSpy,
        }),
        __spies: spies,
    };
});

jest.mock('../instrumentation', () => {
    return {
        ...jest.requireActual('../instrumentation'),
        Instrumentation: class mockInstrumentation {
            constructor() {}
            instrumentNetwork = () => {};
        },
    };
});

import { __spies as uiApiRecordsSpies } from '@salesforce/lds-adapters-uiapi';
import { __spies as lwcLdsSpies } from '@ldsjs/lwc-lds';
import { __spies as instrumentationSpies } from 'instrumentation/service';

beforeEach(() => {
    instrumentationSpies.cacheStatsLogHitsSpy.mockClear();
    instrumentationSpies.cacheStatsLogMissesSpy.mockClear();
    instrumentationSpies.counterIncrementSpy.mockClear();
    instrumentationSpies.percentileUpdateSpy.mockClear();
    instrumentationSpies.timerAddDurationSpy.mockClear();
});

describe('lds main', () => {
    describe('updateRecord', () => {
        it('should filter emit snapshot data from resolved promise', () => {
            const snapshotData = {};
            uiApiRecordsSpies.updateRecordSpy.mockResolvedValue({
                data: snapshotData,
            });

            return expect(
                updateRecord({
                    apiName: 'Opportunity',
                    fields: {},
                })
            ).resolves.toBe(snapshotData);
        });
    });

    describe('updateRecordAvatar', () => {
        it('should filter emit snapshot data from resolved promise', () => {
            const snapshotData = {};
            uiApiRecordsSpies.updateRecordAvatarSpy.mockResolvedValue({
                data: snapshotData,
            });

            return updateRecordAvatar({
                recordId: '1234',
                actionType: 'dissassociateavatar',
            } as any).then((result: any) => {
                expect(result).toBe(snapshotData);
            });
        });
    });

    describe('createRecord', () => {
        it('should filter emit snapshot data from resolved promise', () => {
            const snapshotData = {};
            uiApiRecordsSpies.createRecordSpy.mockResolvedValue({
                data: snapshotData,
            });

            return expect(
                createRecord({
                    apiName: 'Opportunity',
                    fields: {},
                })
            ).resolves.toBe(snapshotData);
        });
    });

    describe('updateLayoutUserState', () => {
        it('should return promise that resolves to undefined', () => {
            uiApiRecordsSpies.updateLayoutUserStateSpy.mockResolvedValueOnce({});

            return expect(
                updateLayoutUserState('Opportunity', '00x000000000000017', 'Full', 'View', {})
            ).resolves.toBeUndefined();
        });
    });

    describe('refresh', () => {
        it('should call function returned by bindWireRefresh', async () => {
            const data = {};
            await refresh(data);
            expect(lwcLdsSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
        });
    });

    describe('_getObjectInfo', () => {
        it('should call adapter returned by GetObjectInfo', async () => {
            const config = {};
            await _getObjectInfo(config as any);
            expect(uiApiRecordsSpies.getObjectInfoSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getLayout', () => {
        it('should call adapter returned by GetLayout', async () => {
            const config = {};
            await _getLayout(config as any);
            expect(uiApiRecordsSpies.getLayoutSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRecord', () => {
        it('should reject when config is invalid', () => {
            uiApiRecordsSpies.getRecordSpy.mockReturnValueOnce(null);

            return expect(_getRecord({ recordId: 'null' })).rejects.toMatchObject({
                message: 'Insufficient config',
            });
        });

        it('should resolve with snapshot data when adapter returns promise', async () => {
            const expected = {};
            uiApiRecordsSpies.getRecordSpy.mockResolvedValueOnce({
                data: expected,
                state: 'Fulfilled',
            });

            await expect(
                _getRecord({
                    recordId: '00x000000000000017',
                    fields: ['Opportunity.Account.Name'],
                })
            ).resolves.toBe(expected);
            expect(instrumentationSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.counterIncrementSpy).toHaveBeenCalledTimes(2);
        });

        it('should return snapshot data synchronously when snapshot is fulfilled', () => {
            const expected = {};
            uiApiRecordsSpies.getRecordSpy.mockReturnValue({
                data: expected,
                state: 'Fulfilled',
            });

            expect(
                _getRecord({
                    recordId: '00x000000000000017',
                    fields: ['Opportunity.Account.Name'],
                })
            ).toBe(expected);
            expect(instrumentationSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationSpies.counterIncrementSpy).toHaveBeenCalledTimes(2);
        });

        it('should throw when returned snapshot is unfulfilled', () => {
            uiApiRecordsSpies.getRecordSpy.mockReturnValue({
                data: {},
                state: 'Unfulfilled',
            });

            return expect(
                _getRecord({
                    recordId: '00x000000000000017',
                    fields: ['Opportunity.Account.Name'],
                })
            ).rejects.toMatchObject({
                message: 'isMissingData=true',
            });
        });
    });

    describe('_getRecordActions', () => {
        it('should call adapter returned by GetRecordActions', async () => {
            const config = {};
            await _getRecordActions(config as any);
            expect(uiApiRecordsSpies.getRecordActionsSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListInfo', () => {
        it('should call adapter returned by GetRelatedListInfo', async () => {
            const config = {};
            await _getRelatedListInfo(config as any);
            expect(uiApiRecordsSpies.getRelatedListInfoSpy).toHaveBeenCalledWith(config);
        });
    });
    describe('_getRelatedListsInfo', () => {
        it('should call adapter returned by GetRelatedListsInfo', async () => {
            const config = {};
            await _getRelatedListsInfo(config as any);
            expect(uiApiRecordsSpies.getRelatedListsInfoSpy).toHaveBeenCalledWith(config);
        });
    });
    describe('_getRelatedListActions', () => {
        it('should call adapter returned by GetRelatedListActions', async () => {
            const config = {};
            await _getRelatedListActions(config as any);
            expect(uiApiRecordsSpies.getRelatedListActionsSpy).toHaveBeenCalledWith(config);
        });
    });
    describe('_getRelatedListCount', () => {
        it('should call adapter returned by GetRelatedListCount', async () => {
            const config = {};
            await _getRelatedListCount(config as any);
            expect(uiApiRecordsSpies.getRelatedListCountSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListsCount', () => {
        it('should call adapter returned by GetRelatedListsCount', async () => {
            const config = {};
            await _getRelatedListsCount(config as any);
            expect(uiApiRecordsSpies.getRelatedListsCountSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListInfoBatch', () => {
        it('should call adapter returned by GetRelatedListInfoBatch', async () => {
            const config = {};
            await _getRelatedListInfoBatch(config as any);
            expect(uiApiRecordsSpies.getRelatedListInfoBatchSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListRecords', () => {
        it('should call adapter returned by GetRelatedListRecords', async () => {
            const config = {};
            await _getRelatedListRecords(config as any);
            expect(uiApiRecordsSpies.getRelatedListRecordsSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListRecordActions', () => {
        it('should call adapter returned by GetRelatedListRecordActions', async () => {
            const config = {};
            await _getRelatedListRecordActions(config as any);
            expect(uiApiRecordsSpies.getRelatedListRecordActionsSpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRelatedListRecordsBatch', () => {
        it('should call adapter returned by GetRelatedListRecordsBatch', async () => {
            const config = {};
            await _getRelatedListRecordsBatch(config as any);
            expect(uiApiRecordsSpies.getRelatedListRecordsBatchSpy).toHaveBeenCalledWith(config);
        });
    });
});
