/**
 * @jest-environment jsdom
 */

import { Adapter, Store } from '@luvio/engine';
import timekeeper from 'timekeeper';

import {
    setupInstrumentation,
    setupInstrumentationWithO11y,
    Instrumentation,
    LightningInteractionSchema,
    refreshApiEvent,
    NORMALIZED_APEX_ADAPTER_NAME,
    REFRESH_APEX_KEY,
    REFRESH_UIAPI_KEY,
    SUPPORTED_KEY,
    UNSUPPORTED_KEY,
    CounterMetric,
} from '../main';
import { REFRESH_ADAPTER_EVENT } from '@luvio/lwc-luvio';
import { stableJSONStringify } from '../utils/utils';
import { LRUCache } from '../utils/lru-cache';

jest.mock('o11y/client');
import { instrumentation as o11yInstrumentation, activity as o11yActivity } from 'o11y/client';

jest.mock('instrumentation/service', () => {
    const spies = {
        cacheStatsLogHitsSpy: jest.fn(),
        cacheStatsLogMissesSpy: jest.fn(),
        counterIncrementSpy: jest.fn(),
        counterDecrementSpy: jest.fn(),
        interaction: jest.fn(),
        percentileUpdateSpy: jest.fn(),
        perfEnd: jest.fn(),
        perfStart: jest.fn(),
        timerAddDurationSpy: jest.fn(),
    };

    return {
        counter: (metricKey) => ({
            increment: spies.counterIncrementSpy,
            decrement: spies.counterDecrementSpy,
            __metricKey: metricKey,
        }),
        interaction: spies.interaction,
        percentileHistogram: (metricKey) => ({
            update: spies.percentileUpdateSpy,
            __metricKey: metricKey,
        }),
        perfEnd: spies.perfEnd,
        perfStart: spies.perfStart,
        registerCacheStats: (name) => ({
            logHits: spies.cacheStatsLogHitsSpy,
            logMisses: spies.cacheStatsLogMissesSpy,
            __name: name,
        }),
        registerPeriodicLogger: jest.fn(),
        registerPlugin: jest.fn(),
        timer: (metricKey) => ({
            addDuration: spies.timerAddDurationSpy,
            __metricKey: metricKey,
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
};

beforeEach(() => {
    instrumentationSpies.aggregateWeakETagEvents.mockClear();
    instrumentationSpies.aggregateRefreshAdapterEvents.mockClear();
    instrumentationSpies.handleRefreshApiCall.mockClear();
    instrumentationSpies.incrementRecordApiNameChangeEvents.mockClear();
    instrumentationSpies.logAdapterCacheMissOutOfTtlDuration.mockClear();
    instrumentationSpies.incrementAdapterRequestMetric.mockClear();
    instrumentationServiceSpies.perfEnd.mockClear();
    instrumentationServiceSpies.perfStart.mockClear();
    instrumentationServiceSpies.cacheStatsLogHitsSpy.mockClear();
    instrumentationServiceSpies.cacheStatsLogMissesSpy.mockClear();
    instrumentationServiceSpies.counterIncrementSpy.mockClear();
    instrumentationServiceSpies.counterDecrementSpy.mockClear();
    instrumentationServiceSpies.timerAddDurationSpy.mockClear();
    (instrumentation as any).adapterCacheMisses = new LRUCache(250);
    (instrumentation as any).resetRefreshStats();
});

afterEach(() => {
    timekeeper.reset();
});

/**
 * Helper method to test metric calls for a metric spy.
 * @param spy The metric spy.
 * @param expectedCalls List of Metric Keys to test.
 */
function testMetricInvocations(metricSpy: any, expectedCalls: any) {
    const actualCalls = metricSpy.mock.instances.map((instance: any) => {
        return instance.__metricKey.get();
    });
    expect(actualCalls).toEqual(expectedCalls);
}

// Number of metric counter invocations that happen during a normal cache hit or miss flow, without
// any of the TTL specific code path happening. To be incremented if additional counters are added for either scenario.
// The counters being hit are:
// - cacheHitMetric or cacheMissMetric
// - cacheHitCountByAdapterMetric or cacheMissCountByAdapterMetric
// - wireRequestCounter
// - totalAdapterRequestSuccessMetric
const baseCacheHitCounterIncrement = 4;
const baseCacheMissCounterIncrement = 4;
const GET_RECORD_TTL = 30000;

describe('instrumentation', () => {
    describe('log lines', () => {
        const interaction: LightningInteractionSchema = {
            kind: 'interaction',
            target: 'merge',
            scope: 'lds-adapters-uiapi',
            context: {
                entityName: 'User',
                fieldName: 'Id',
            },
            eventSource: 'lds-dv-bandaid',
            eventType: 'system',
            attributes: null,
        };

        it('should call the log function, which will call interaction', () => {
            instrumentation.instrumentNetwork(interaction);
            expect(instrumentationServiceSpies.interaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('counter metric', () => {
        const counter: CounterMetric = {
            kind: 'counter',
            name: 'foo',
            value: 1,
        };

        it('should increment `foo` counter by 1', () => {
            counter.value = 1;
            instrumentation.instrumentNetwork(counter);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledWith(1);
        });
        it('should increment `foo` counter by 100', () => {
            counter.value = 100;
            instrumentation.instrumentNetwork(counter);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledWith(100);
        });
        it('should increment `foo` counter by -100', () => {
            counter.value = -100;
            instrumentation.instrumentNetwork(counter);
            expect(instrumentationServiceSpies.counterDecrementSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.counterDecrementSpy).toHaveBeenCalledWith(100);
        });
    });

    describe('cache misses out of ttl', () => {
        it('should not log metrics when getRecord adapter has a cache hit on existing value within TTL', async () => {
            const mockGetRecordAdapter = (config) => {
                if (config.cacheHit) {
                    return {};
                } else {
                    return new Promise((resolve) => {
                        setTimeout(() => resolve({}));
                    });
                }
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                mockGetRecordAdapter,
                { apiFamily: 'UiApi', name: 'getRecord', ttl: GET_RECORD_TTL }
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };
            const getRecordConfigCacheHit = {
                recordId: '00x000000000000017',
                // Make sure that the key is the same when parameters are the same but ordering is different.
                optionalFields: ['Account.Id', 'Account.Name'],
                cacheHit: true,
            };

            const recordKey = 'UiApi.getRecord:' + stableJSONStringify(getRecordConfig);
            // Cache Miss #1
            const now = Date.now();
            timekeeper.freeze(now);
            const snapshotPromise = instrumentedAdapter(getRecordConfig);

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            // ensure timer is called after snapshot promise is resolved
            await snapshotPromise;
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);

            // Cache Hit
            // Expected: Increment of cacheStatsLogHits, all cache miss metrics stay unchanged.
            instrumentedAdapter(getRecordConfigCacheHit);

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(2);
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-hit-count' },
                { owner: 'lds', name: 'cache-hit-count.UiApi.getRecord' },
            ];
            testMetricInvocations(
                instrumentationServiceSpies.counterIncrementSpy,
                expectedMetricCalls
            );

            // Verify Cache Stats Calls
            const expectedCacheStatsCalls = ['lds:UiApi.getRecord'];
            expect(
                instrumentationServiceSpies.cacheStatsLogHitsSpy.mock.instances.map((instance) => {
                    return instance.__name;
                })
            ).toEqual(expectedCacheStatsCalls);
            expect(
                instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                    (instance) => {
                        return instance.__name;
                    }
                )
            ).toEqual(expectedCacheStatsCalls);
        });

        it('should not log metrics when adapter with no TTL defined has a cache miss on existing value out of TTL', () => {
            const unknownAdapter = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(unknownAdapter, {
                apiFamily: 'unknownApiFamily',
                name: 'unknownAdapter',
            });
            const adapterConfig = {
                key: 'value',
            };

            // Cache Miss #1
            const now = Date.now();
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

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.unknownApiFamily.unknownAdapter' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.unknownApiFamily.unknownAdapter' },
                { owner: 'LIGHTNING.lds.service', name: 'request.unknownApiFamily.unknownAdapter' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.unknownApiFamily.unknownAdapter' },
            ];
            testMetricInvocations(
                instrumentationServiceSpies.counterIncrementSpy,
                expectedMetricCalls
            );

            // Verify Cache Stats Calls
            const expectedCacheStatsCalls = [
                'lds:unknownApiFamily.unknownAdapter',
                'lds:unknownApiFamily.unknownAdapter',
            ];
            expect(
                instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                    (instance) => {
                        return instance.__name;
                    }
                )
            ).toEqual(expectedCacheStatsCalls);
        });

        it('should log metrics when getRecord adapter has a cache miss on existing value out of TTL', () => {
            const mockGetRecordAdapter = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                mockGetRecordAdapter,
                { apiFamily: 'UiApi', name: 'getRecord', ttl: GET_RECORD_TTL }
            );
            const getRecordConfig = {
                optionalFields: ['Account.Id', 'Account.Name'],
                recordId: '00x000000000000018',
            };

            const recordKey = 'UiApi.getRecord:' + stableJSONStringify(getRecordConfig);

            // Cache Miss #1
            const now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Miss #2, outside of TTL
            instrumentedAdapter(getRecordConfig);

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            // 2 calls from regular cache stat misses logging, 1 from logAdapterCacheMissOutOfTtlDuration
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(3);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                2
            );
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenLastCalledWith(30001);
            const updatedTimestamp = now + 30001;

            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(
                updatedTimestamp
            );

            // + 1 from logAdapterCacheMissOutOfTtlDuration
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement + 1
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.UiApi.getRecord' },
                { owner: 'lds', name: 'cache-miss-out-of-ttl-count.UiApi.getRecord' },
            ];
            testMetricInvocations(
                instrumentationServiceSpies.counterIncrementSpy,
                expectedMetricCalls
            );

            // Verify Cache Stats Calls
            const expectedCacheStatsCalls = [
                'lds:UiApi.getRecord',
                'lds:UiApi.getRecord',
                'lds:UiApi.getRecord:out-of-ttl-miss',
            ];
            expect(
                instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                    (instance) => {
                        return instance.__name;
                    }
                )
            ).toEqual(expectedCacheStatsCalls);
        });
    });

    describe('instrumentedAdapter', () => {
        it('logs cache miss when adapter returns a Promise', async () => {
            const mockAdapter = ((config) => {
                if (config.cacheHit === true) {
                    return {};
                } else {
                    return Promise.resolve({});
                }
            }) as Adapter<any, any>;

            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });

            await instrumentedAdapter({ cacheHit: false });

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);

            // no TTL provided so these metrics should be 0
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(0);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(4);
        });

        it('logs nothings when adapter returns null', async () => {
            const mockAdapter = (() => {
                return null;
            }) as Adapter<any, any>;

            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });

            await instrumentedAdapter({});

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(0);
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
        const GET_RECORD_ADAPTER_NAME = 'UiApi.getRecord';
        const uiApiAdapterRefreshEvent = {
            [REFRESH_ADAPTER_EVENT]: true,
            adapterName: GET_RECORD_ADAPTER_NAME,
        };
        const apexAdapterRefreshEvent = {
            [REFRESH_ADAPTER_EVENT]: true,
            adapterName: 'Apex.getApex__ContactController_getContactList_false',
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
            expect(
                (instrumentation as any).refreshAdapterEvents[NORMALIZED_APEX_ADAPTER_NAME]
            ).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(0);
        });

        it('should increment unsupported and per adapter counts for non-apex adapter', () => {
            instrumentation.instrumentNetwork(refreshApiEvent(REFRESH_APEX_KEY)());
            instrumentation.instrumentNetwork(uiApiAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(1);
            expect((instrumentation as any).refreshAdapterEvents[GET_RECORD_ADAPTER_NAME]).toEqual(
                1
            );
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
            expect(
                (instrumentation as any).refreshAdapterEvents[NORMALIZED_APEX_ADAPTER_NAME]
            ).toEqual(1);
            expect((instrumentation as any).refreshAdapterEvents[GET_RECORD_ADAPTER_NAME]).toEqual(
                1
            );
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
                return new Promise((resolve) => {
                    setTimeout(() => resolve({ state: 'Unfulfilled' }));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                mockGetRecordAdapter,
                { apiFamily: 'UiApi', name: 'getRecord', ttl: GET_RECORD_TTL }
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then((_result) => {
                expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);

                // Verify Metric Calls
                const expectedMetricCalls = [
                    { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                    { owner: 'LIGHTNING.lds.service', name: 'request' },
                    { owner: 'lds', name: 'cache-miss-count' },
                    { owner: 'lds', name: 'cache-miss-count.UiApi.getRecord' },
                ];
                testMetricInvocations(
                    instrumentationServiceSpies.counterIncrementSpy,
                    expectedMetricCalls
                );

                // Verify Cache Stats Calls
                expect(
                    instrumentationServiceSpies.cacheStatsLogHitsSpy.mock.instances.map(
                        (instance) => {
                            return instance.__name;
                        }
                    )
                ).toEqual([]);
                expect(
                    instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                        (instance) => {
                            return instance.__name;
                        }
                    )
                ).toEqual(['lds:UiApi.getRecord']);
            });
        });

        it('should not instrument error when an invalid config is provided', () => {
            const mockGetRecordAdapter = () => {
                return null;
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                mockGetRecordAdapter,
                { apiFamily: 'UiApi', name: 'getRecord', ttl: GET_RECORD_TTL }
            );
            const getRecordConfig = {
                recordId: 'not a valid id',
                optionalFields: 'also invalid',
            };

            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
            ];
            testMetricInvocations(
                instrumentationServiceSpies.counterIncrementSpy,
                expectedMetricCalls
            );

            // Verify Cache Stats Calls
            const expectedCacheStatsCalls = [];
            expect(
                instrumentationServiceSpies.cacheStatsLogHitsSpy.mock.instances.map((instance) => {
                    return instance.__name;
                })
            ).toEqual(expectedCacheStatsCalls);
            expect(
                instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                    (instance) => {
                        return instance.__name;
                    }
                )
            ).toEqual(expectedCacheStatsCalls);
        });

        it('should not instrument error when a non UnfulfilledSnapshot Promise is returned to the adapter', () => {
            const mockGetRecordAdapter = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = (instrumentation.instrumentAdapter as any)(
                mockGetRecordAdapter,
                { apiFamily: 'UiApi', name: 'getRecord', ttl: GET_RECORD_TTL }
            );
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then((_result) => {
                expect(instrumentationSpies.incrementAdapterRequestMetric).toHaveBeenCalledTimes(1);

                // Verify Metric Calls
                const expectedMetricCalls = [
                    { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                    { owner: 'LIGHTNING.lds.service', name: 'request' },
                    { owner: 'lds', name: 'cache-miss-count' },
                    { owner: 'lds', name: 'cache-miss-count.UiApi.getRecord' },
                ];
                testMetricInvocations(
                    instrumentationServiceSpies.counterIncrementSpy,
                    expectedMetricCalls
                );

                // Verify Cache Stats Calls
                expect(
                    instrumentationServiceSpies.cacheStatsLogHitsSpy.mock.instances.map(
                        (instance) => {
                            return instance.__name;
                        }
                    )
                ).toEqual([]);
                expect(
                    instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                        (instance) => {
                            return instance.__name;
                        }
                    )
                ).toEqual(['lds:UiApi.getRecord']);
            });
        });
    });

    describe('getApex cardinality', () => {
        it('should aggregate all dynamic metrics under getApex', () => {
            const mockGetApexAdapter = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };

            const instrumentedGetApexAdapterOne = (instrumentation.instrumentAdapter as any)(
                mockGetApexAdapter,
                { apiFamily: 'Apex', name: 'getApex__ContactController_getContactList_false' }
            );
            const instrumentedGetApexAdapterTwo = (instrumentation.instrumentAdapter as any)(
                mockGetApexAdapter,
                { apiFamily: 'Apex', name: 'getApex__AccountController_getAccountList_true' }
            );

            expect(instrumentedGetApexAdapterOne.name).toEqual(
                'getApex__ContactController_getContactList_false__instrumented'
            );
            expect(instrumentedGetApexAdapterTwo.name).toEqual(
                'getApex__AccountController_getAccountList_true__instrumented'
            );

            instrumentedGetApexAdapterOne({ name: 'LDS', foo: 'bar' });
            instrumentedGetApexAdapterTwo({ name: 'LDS', foo: 'baz' });

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(2);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.Apex.getApex' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.Apex.getApex' },
                { owner: 'LIGHTNING.lds.service', name: 'request.Apex.getApex' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'lds', name: 'cache-miss-count' },
                { owner: 'lds', name: 'cache-miss-count.Apex.getApex' },
            ];
            testMetricInvocations(
                instrumentationServiceSpies.counterIncrementSpy,
                expectedMetricCalls
            );

            // Verify Cache Stats Calls
            const expectedCacheStatsCalls = ['lds:Apex.getApex', 'lds:Apex.getApex'];
            expect(
                instrumentationServiceSpies.cacheStatsLogMissesSpy.mock.instances.map(
                    (instance) => {
                        return instance.__name;
                    }
                )
            ).toEqual(expectedCacheStatsCalls);
        });
    });

    describe('instrumentGraphqlAdapter', () => {
        it('logs mixed bag response in case of a cache hit', async () => {
            const mockSnapshot = {
                data: {
                    data: {
                        a: 1,
                    },
                    errors: ['errors'],
                },
            };

            const mockAdapter = ((config) => {
                if (config.cacheHit === true) {
                    return mockSnapshot;
                } else {
                    return Promise.resolve(mockSnapshot);
                }
            }) as Adapter<any, any>;

            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'gql',
                name: 'graphQL',
            });

            await instrumentedAdapter({ cacheHit: true });

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);

            // no TTL provided so these metrics should be 0
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(0);

            // 4 standard counters + 1 for gql counter
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(5);
        });
        it('logs mixed bag response in case of a cache miss', async () => {
            const mockSnapshot = {
                data: {
                    data: {
                        a: 1,
                    },
                    errors: ['errors'],
                },
            };

            const mockAdapter = ((config) => {
                if (config.cacheHit === true) {
                    return mockSnapshot;
                } else {
                    return Promise.resolve(mockSnapshot);
                }
            }) as Adapter<any, any>;

            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'gql',
                name: 'graphQL',
            });

            await instrumentedAdapter({ cacheHit: false });

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(1);

            // no TTL provided so these metrics should be 0
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(0);

            // 4 standard counters + 1 for gql counter
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(5);
        });
    });
});

describe('setupInstrumentation', () => {
    describe('sets store scheduler', () => {
        it('adds instrumentation with default scheduler', async () => {
            const luvio = {} as any;
            const store = new Store();
            setupInstrumentation(luvio, store);
            expect(store.scheduler).toBeDefined();
            // dummy trim task returning 5 trimmed entries
            await store.scheduler(() => 5);

            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledWith('store-trim-task');
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledWith('store-trim-task', {
                'store-trimmed-count': 5,
            });
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalled();
        });

        it('adds instrumentation with custom scheduler', () => {
            const luvio = {} as any;
            // store with custom synchronous scheduler
            const store = new Store({
                scheduler: (callback) => {
                    callback();
                },
            });
            setupInstrumentation(luvio, store);
            // dummy trim task returning 5 trimmed entries
            store.scheduler(() => 5);

            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledWith('store-trim-task');
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledWith('store-trim-task', {
                'store-trimmed-count': 5,
            });
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalled();
        });

        it('no-ops with no-op scheduler', () => {
            const luvio = {} as any;
            // store with custom no-op scheduler
            const store = new Store({ scheduler: () => {} });
            setupInstrumentation(luvio, store);
            // dummy trim task returning 5 trimmed entries
            store.scheduler(() => 5);

            expect(instrumentationServiceSpies.counterIncrementSpy).not.toHaveBeenCalled();
            expect(instrumentationServiceSpies.perfStart).not.toHaveBeenCalled();
            expect(instrumentationServiceSpies.perfEnd).not.toHaveBeenCalled();
            expect(instrumentationServiceSpies.timerAddDurationSpy).not.toHaveBeenCalled();
        });
    });
});

describe('setupInstrumentationWithO11y', () => {
    // TODO [W-9782972]: part of internal instrumentation work
    // describe('sets store scheduler', () => {});

    describe('Luvio Store Performance', () => {
        it('instruments luvio store methods with o11y', () => {
            // Setup
            const mockLuvio: any = {
                storeBroadcast: jest.fn,
                storeIngest: jest.fn,
                storeLookup: jest.fn,
            };
            jest.spyOn(o11yInstrumentation, 'startActivity');
            jest.spyOn(o11yActivity, 'stop');

            // Exercise
            setupInstrumentationWithO11y(mockLuvio, undefined);
            mockLuvio.storeBroadcast();
            mockLuvio.storeIngest();
            mockLuvio.storeLookup();

            // Verify
            expect(o11yInstrumentation.startActivity).toHaveBeenCalledTimes(3);
            expect(o11yActivity.stop).toHaveBeenCalledTimes(3);
        });
    });
});
