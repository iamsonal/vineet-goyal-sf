/**
 * @jest-environment jsdom
 */

import { Instrumentation, refreshApiEvent } from '../main';
import { getRecordConfigKey } from '../config-key-functions';
import timekeeper from 'timekeeper';

jest.mock('instrumentation/service', () => {
    const spies = {
        cacheStatsLogHitsSpy: jest.fn(),
        cacheStatsLogMissesSpy: jest.fn(),
        counterIncrementSpy: jest.fn(),
        interaction: jest.fn(),
        percentileUpdateSpy: jest.fn(),
        perfEnd: jest.fn(),
        perfStart: jest.fn(),
        timerAddDurationSpy: jest.fn(),
    };

    return {
        counter: () => ({
            increment: spies.counterIncrementSpy,
        }),
        interaction: spies.interaction,
        percentileHistogram: () => ({
            update: spies.percentileUpdateSpy,
        }),
        perfEnd: spies.perfEnd,
        perfStart: spies.perfStart,
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

import { __spies as instrumentationServiceSpies } from 'instrumentation/service';

const instrumentation = new Instrumentation();

const instrumentationSpies = {
    aggregateWeakETagEvents: jest.spyOn(instrumentation, 'aggregateWeakETagEvents'),
    aggregateRefreshAdapterEvents: jest.spyOn(instrumentation, 'aggregateRefreshAdapterEvents'),
    handleRefreshApiCall: jest.spyOn(instrumentation, 'handleRefreshApiCall'),
    incrementRecordApiNameChangeEvents: jest.spyOn(
        instrumentation,
        'incrementRecordApiNameChangeCount'
    ),
    logAdapterCacheMissOutOfTtlDuration: jest.spyOn(
        instrumentation,
        'logAdapterCacheMissOutOfTtlDuration'
    ),
    incrementAdapterRequestMetric: jest.spyOn(instrumentation, 'incrementAdapterRequestMetric'),
    incrementAdapterErrorMetric: jest.spyOn(instrumentation, 'incrementAdapterErrorMetric'),
};

beforeEach(() => {
    instrumentationSpies.aggregateWeakETagEvents.mockClear();
    instrumentationSpies.aggregateRefreshAdapterEvents.mockClear();
    instrumentationSpies.handleRefreshApiCall.mockClear();
    instrumentationSpies.incrementRecordApiNameChangeEvents.mockClear();
    instrumentationSpies.logAdapterCacheMissOutOfTtlDuration.mockClear();
    instrumentationSpies.incrementAdapterRequestMetric.mockClear();
    instrumentationSpies.incrementAdapterErrorMetric.mockClear();
    instrumentationServiceSpies.perfEnd.mockClear();
    instrumentationServiceSpies.perfStart.mockClear();
    instrumentationServiceSpies.timerAddDurationSpy.mockClear();

    (instrumentation as any).resetRefreshStats();
});

describe('instrumentation', () => {
    describe('instrumentGetRecordAdapter', () => {
        it('should not log metrics when getRecord adapter has a cache hit on existing value out of TTL', () => {
            const mockGetRecordAdapter = config => {
                if (config.cacheHit) {
                    return {};
                } else {
                    return new Promise(resolve => {
                        setTimeout(() => resolve({}));
                    });
                }
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'getRecord',
                mockGetRecordAdapter
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };
            const getRecordConfigCacheHit = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
                cacheHit: true,
            };

            // Cache Miss #1
            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Hit
            instrumentedAdapter(getRecordConfigCacheHit);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('should not log metrics when adapter with no TTL defined has a cache miss on existing value out of TTL', () => {
            const unknownAdapter = () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'unknownAdapter',
                unknownAdapter
            );
            const adapterConfig = {
                key: 'value',
            };

            // Cache Miss #1
            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(adapterConfig);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);

            // Cache Miss #2
            instrumentedAdapter(adapterConfig);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
        });

        it('should log metrics when getRecord adapter has a cache miss on existing value out of TTL', () => {
            const mockGetRecordAdapter = () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'getRecord',
                mockGetRecordAdapter
            );
            const getRecordConfig = {
                optionalFields: ['Account.Id', 'Account.Name'],
                recordId: '00x000000000000018',
            };

            const recordKey = getRecordConfigKey(getRecordConfig);

            // Cache Miss #1
            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Miss #2, outside of TTL
            instrumentedAdapter(getRecordConfig);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                2
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenLastCalledWith(30001);
            const updatedTimestamp = now + 30001;
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(
                updatedTimestamp
            );
        });
    });

    describe('weakETagZero', () => {
        it('should aggregate weaketagzero events when instrumentNetwork is called', () => {
            const context = {
                'existing-weaketag-0': false,
                'incoming-weaketag-0': true,
                apiName: 'Account',
            };
            instrumentation.instrumentNetwork(context);
            expect(instrumentationSpies.aggregateWeakETagEvents).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).weakEtagZeroEvents).toEqual({
                'weaketag-0-Account': {
                    'existing-weaketag-0': 1,
                    'incoming-weaketag-0': 1,
                },
            });

            window.dispatchEvent(new Event('beforeunload'));
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(1);
        });

        it('should immediately log when instrumentNetwork is called with any other event', () => {
            const context = {
                random: 'event',
            };
            instrumentation.instrumentNetwork(context);
            expect(instrumentationSpies.aggregateWeakETagEvents).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(1);
        });
    });

    describe('recordApiNameChange', () => {
        it('should increment record apiName change counter when instrumentNetwork is called', () => {
            const context = {
                'record-api-name-change-event': true,
                existingApiName: 'Account',
                incomingApiName: 'NewAccount',
            };
            instrumentation.instrumentNetwork(context);
            expect(instrumentationSpies.incrementRecordApiNameChangeEvents).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(0);
            expect(
                (instrumentation as any).recordApiNameChangeCounters[context.existingApiName]
            ).toBeTruthy();
        });

        it('should immediately log when instrumentNetwork is called with any other event', () => {
            const context = {
                random: 'event',
            };
            instrumentation.instrumentNetwork(context);
            expect(instrumentationSpies.incrementRecordApiNameChangeEvents).toHaveBeenCalledTimes(
                0
            );
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(1);
        });
    });

    describe('refresh call events', () => {
        const REFRESH_ADAPTER_EVENT = 'refresh-adapter-event';
        const REFRESH_APEX_KEY = 'refreshApex';
        const REFRESH_UIAPI_KEY = 'refreshUiApi';
        const SUPPORTED_KEY = 'refreshSupported';
        const UNSUPPORTED_KEY = 'refreshUnsupported';
        const APEX_ADAPTER_NAME = 'getApex';
        const uiApiAdapterRefreshEvent = {
            [REFRESH_ADAPTER_EVENT]: true,
            adapterName: 'getRecord',
        };
        const apexAdapterRefreshEvent = {
            [REFRESH_ADAPTER_EVENT]: true,
            adapterName: 'getApex__ContactController_getContactList_false',
        };
        it('should increment refreshApex call count, and set lastRefreshApiCall', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_APEX_KEY)());
            expect(instrumentationSpies.handleRefreshApiCall).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).refreshApiCallEventStats[REFRESH_APEX_KEY]).toEqual(1);
            expect((instrumentation as any).lastRefreshApiCall).toEqual(REFRESH_APEX_KEY);
        });
        it('should increment refreshUiApi call count, and set lastRefreshApiCall', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_UIAPI_KEY)());
            expect(instrumentationSpies.handleRefreshApiCall).toHaveBeenCalledTimes(1);
            expect((instrumentation as any).refreshApiCallEventStats[REFRESH_UIAPI_KEY]).toEqual(1);
            expect((instrumentation as any).lastRefreshApiCall).toEqual(REFRESH_UIAPI_KEY);
        });
        it('should increment supported and per adapter counts for apex adapter', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_APEX_KEY)());
            instrumentation.instrumentNetwork(apexAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).refreshAdapterEvents[APEX_ADAPTER_NAME]).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(0);
        });
        it('should increment unsupported and per adapter counts for non-apex adapter', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_APEX_KEY)());
            instrumentation.instrumentNetwork(uiApiAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(1);
            expect(
                (instrumentation as any).refreshAdapterEvents[uiApiAdapterRefreshEvent.adapterName]
            ).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(1);
        });
        it('should increment unsupported and per adapter counts for non-apex adapter when refreshUiApi is called', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_UIAPI_KEY)());
            instrumentation.instrumentNetwork(uiApiAdapterRefreshEvent);
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_UIAPI_KEY)());
            instrumentation.instrumentNetwork(apexAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(2);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(2);
        });
        it('should reset stat trackers after call to logRefreshStats', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_APEX_KEY)());
            instrumentation.instrumentNetwork(apexAdapterRefreshEvent);
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_UIAPI_KEY)());
            instrumentation.instrumentNetwork(uiApiAdapterRefreshEvent);
            expect((instrumentation as any).refreshAdapterEvents[APEX_ADAPTER_NAME]).toEqual(1);
            expect(
                (instrumentation as any).refreshAdapterEvents[uiApiAdapterRefreshEvent.adapterName]
            ).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(1);
            (instrumentation as any).logRefreshStats();
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshAdapterEvents).toEqual({});
        });
    });

    describe('Observability metrics', () => {
        it('should instrument error when UnfulfilledSnapshot is returned to the adapter', () => {
            const mockGetRecordAdapter = () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({ state: 'Unfulfilled' }));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'getRecord',
                mockGetRecordAdapter
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then(_result => {
                expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.incrementAdapterErrorMetric).toHaveBeenCalledTimes(1);
            });
        });

        it('should not instrument error when an invalid config is provided', () => {
            const mockGetRecordAdapter = () => {
                return null;
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'getRecord',
                mockGetRecordAdapter
            );
            const getRecordConfig = {
                recordId: 'not a valid id',
                optionalFields: 'also invalid',
            };

            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.incrementAdapterErrorMetric).toHaveBeenCalledTimes(0);
        });

        it('should not instrument error when a non UnfulfilledSnapshot Promise is returned to the adapter', () => {
            const mockGetRecordAdapter = () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                'getRecord',
                mockGetRecordAdapter
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then(_result => {
                expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.incrementAdapterErrorMetric).toHaveBeenCalledTimes(0);
            });
        });
    });
});
