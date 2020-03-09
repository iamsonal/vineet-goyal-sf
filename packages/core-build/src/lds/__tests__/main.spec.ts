jest.mock('@salesforce/lds-adapters-uiapi', () => {
    const mockAdapterFactory = () => () => null;

    const spies = {
        getRecordFactorySpy: jest.fn(mockAdapterFactory),
        getRecordActionsFactorySpy: jest.fn(mockAdapterFactory),
        getLayoutFactorySpy: jest.fn(mockAdapterFactory),
        getObjectInfoFactorySpy: jest.fn(mockAdapterFactory),
        updateLayoutUserStateSpy: jest.fn(mockAdapterFactory),
        createRecordSpy: jest.fn(mockAdapterFactory),
        updateRecordSpy: jest.fn(mockAdapterFactory),
        updateRecordAvatarSpy: jest.fn(mockAdapterFactory),
    };

    return {
        ...jest.requireActual('@salesforce/lds-adapters-uiapi'),
        GetRecord: () => spies.getRecordFactorySpy,
        GetRecordActions: () => spies.getRecordActionsFactorySpy,
        GetLayout: () => spies.getLayoutFactorySpy,
        GetObjectInfo: () => spies.getObjectInfoFactorySpy,
        UpdateLayoutUserState: () => spies.updateLayoutUserStateSpy,
        CreateRecord: () => spies.createRecordSpy,
        UpdateRecord: () => spies.updateRecordSpy,
        UpdateRecordAvatar: () => spies.updateRecordAvatarSpy,
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
} from '../main';

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
        it('should call function returned by bindWireRefresh', () => {
            const data = {};
            refresh(data);
            expect(lwcLdsSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
        });
    });

    describe('_getObjectInfo', () => {
        it('should call adapter returned by GetObjectInfo', () => {
            const config = {};
            _getObjectInfo(config);
            expect(uiApiRecordsSpies.getObjectInfoFactorySpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getLayout', () => {
        it('should call adapter returned by GetLayout', () => {
            const config = {};
            _getLayout(config);
            expect(uiApiRecordsSpies.getLayoutFactorySpy).toHaveBeenCalledWith(config);
        });
    });

    describe('_getRecord', () => {
        it('should reject when config is invalid', () => {
            uiApiRecordsSpies.getRecordFactorySpy.mockReturnValueOnce(null);

            return expect(_getRecord({ recordId: 'null' })).rejects.toMatchObject({
                message: 'Insufficient config',
            });
        });

        it('should resolve with snapshot data when adapter returns promise', async () => {
            const expected = {};
            uiApiRecordsSpies.getRecordFactorySpy.mockResolvedValueOnce({
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

        it('should resolve with snapshot data when adapter fulfilled snapshot', async () => {
            const expected = {};
            uiApiRecordsSpies.getRecordFactorySpy.mockReturnValue({
                data: expected,
                state: 'Fulfilled',
            });
            await expect(
                _getRecord({
                    recordId: '00x000000000000017',
                    fields: ['Opportunity.Account.Name'],
                })
            ).resolves.toBe(expected);
            expect(instrumentationSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationSpies.counterIncrementSpy).toHaveBeenCalledTimes(2);
        });

        it('should throw when returned snapshot is unfulfilled', () => {
            uiApiRecordsSpies.getRecordFactorySpy.mockReturnValue({
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
        it('should call adapter returned by GetRecordActions', () => {
            const config = {};
            _getRecordActions(config);
            expect(uiApiRecordsSpies.getRecordActionsFactorySpy).toHaveBeenCalledWith(config);
        });
    });
});
