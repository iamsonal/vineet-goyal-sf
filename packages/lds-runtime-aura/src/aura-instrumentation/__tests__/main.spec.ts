/**
 * @jest-environment jsdom
 *
 * Note: Aura code is only running in browser
 */
import timekeeper from 'timekeeper';

import { REFRESH_ADAPTER_EVENT, ADAPTER_UNFULFILLED_ERROR } from '@luvio/lwc-luvio';
import { Adapter, AdapterRequestContext, FetchResponse, HttpStatusCode } from '@luvio/engine';

import {
    incrementRequestResponseCount,
    log,
    AdapterUnfulfilledError,
    Instrumentation,
    LightningInteractionSchema,
    NORMALIZED_APEX_ADAPTER_NAME,
    REFRESH_APEX_KEY,
    REFRESH_UIAPI_KEY,
    SUPPORTED_KEY,
    UNSUPPORTED_KEY,
} from '../main';
import { stableJSONStringify } from '../utils/utils';

import * as ldsInstrumentation from '@salesforce/lds-instrumentation';

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
    logAdapterCacheMissOutOfTtlDuration: jest.spyOn(
        instrumentation,
        'logAdapterCacheMissOutOfTtlDuration'
    ),
    incrementAdapterRequestErrorCount: jest.spyOn(
        instrumentation,
        'incrementAdapterRequestErrorCount'
    ),
};

beforeEach(() => {
    instrumentationSpies.aggregateWeakETagEvents.mockClear();
    instrumentationSpies.aggregateRefreshAdapterEvents.mockClear();
    instrumentationSpies.logAdapterCacheMissOutOfTtlDuration.mockClear();
    instrumentationServiceSpies.perfEnd.mockClear();
    instrumentationServiceSpies.perfStart.mockClear();
    instrumentationServiceSpies.cacheStatsLogHitsSpy.mockClear();
    instrumentationServiceSpies.cacheStatsLogMissesSpy.mockClear();
    instrumentationServiceSpies.counterIncrementSpy.mockClear();
    instrumentationServiceSpies.counterDecrementSpy.mockClear();
    (instrumentation as any).adapterCacheMisses = new ldsInstrumentation.LRUCache(250);
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
// - wireRequestCounter
// - totalAdapterRequestSuccessMetric
const baseCacheHitCounterIncrement = 2;
const baseCacheMissCounterIncrement = 2;
const GET_RECORD_TTL = 30000;

describe('incrementRequestResponseCount', () => {
    const mockFetchResponse200: FetchResponse<unknown> = {
        status: HttpStatusCode.Ok,
        body: {},
        statusText: 'OK',
        ok: true,
        headers: undefined,
    };
    const mockFetchResponse400: FetchResponse<unknown> = {
        status: HttpStatusCode.BadRequest,
        body: {},
        statusText: 'Bad Request',
        ok: false,
        headers: undefined,
    };
    it('should bucket counters based on status code', () => {
        incrementRequestResponseCount(() => mockFetchResponse200);
        incrementRequestResponseCount(() => mockFetchResponse400);
        expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(2);
        const expectedMetricCalls = [
            { owner: 'LIGHTNING.lds.service', name: 'network-response.200' },
            { owner: 'LIGHTNING.lds.service', name: 'network-response.400' },
        ];
        testMetricInvocations(instrumentationServiceSpies.counterIncrementSpy, expectedMetricCalls);
    });
});

describe('instrumentation', () => {
    describe('log lines', () => {
        const interaction: LightningInteractionSchema = {
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

        it('will call interaction from instrumentation/service', () => {
            log(null, interaction);
            expect(instrumentationServiceSpies.interaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('notifyChangeNetwork', () => {
        const NETWORK_TRANSACTION_NAME = 'lds-network';
        const NOTIFY_CHANGE_NETWORK = 'notify-change-network';
        it('calls perfEnd with a boolean to reflect if weakEtags are unique', () => {
            instrumentation.notifyChangeNetwork(true);
            expect(instrumentationServiceSpies.perfStart).toBeCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toBeCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toBeCalledWith(NETWORK_TRANSACTION_NAME, {
                [NOTIFY_CHANGE_NETWORK]: true,
            });
        });
        it('calls perfEnd with "error" if there was an error', () => {
            instrumentation.notifyChangeNetwork(true, true);
            expect(instrumentationServiceSpies.perfStart).toBeCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toBeCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toBeCalledWith(NETWORK_TRANSACTION_NAME, {
                [NOTIFY_CHANGE_NETWORK]: 'error',
            });
        });
    });

    describe('incrementRecordApiNameChangeCounter', () => {
        const DUMMY_API_NAME = 'dummyApiName';
        const testApiName = 'foo';
        it('creates a new counter and increments it by 1', () => {
            instrumentation.incrementRecordApiNameChangeCount(DUMMY_API_NAME, testApiName);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledWith(1);
            testMetricInvocations(instrumentationServiceSpies.counterIncrementSpy, [
                { owner: 'lds', name: `record-api-name-change-count.${testApiName}` },
            ]);
        });
        it('finds the existing counter in the map and increments it by 1', () => {
            instrumentation.incrementRecordApiNameChangeCount(DUMMY_API_NAME, testApiName);
            instrumentation.incrementRecordApiNameChangeCount(DUMMY_API_NAME, testApiName);
            testMetricInvocations(instrumentationServiceSpies.counterIncrementSpy, [
                { owner: 'lds', name: `record-api-name-change-count.${testApiName}` },
                { owner: 'lds', name: `record-api-name-change-count.${testApiName}` },
            ]);
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
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            await snapshotPromise;

            // Cache Hit
            // Expected: Increment of cacheStatsLogHits, all cache miss metrics stay unchanged.
            instrumentedAdapter(getRecordConfigCacheHit);

            expect(instrumentationServiceSpies.cacheStatsLogHitsSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.cacheStatsLogMissesSpy).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                1
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
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
                { owner: 'LIGHTNING.lds.service', name: 'request.unknownApiFamily.unknownAdapter' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
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
            const updatedTimestamp = now + 30001;

            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(
                updatedTimestamp
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'LIGHTNING.lds.service', name: 'request.UiApi.getRecord' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
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

            // no TTL provided so these metrics should be 0
            expect(instrumentationSpies.logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(
                0
            );
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(0);
            expect(instrumentationServiceSpies.counterIncrementSpy).toHaveBeenCalledTimes(2);
        });

        it('logs nothing when adapter returns null', async () => {
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

        it('sends request context to the adapter', async () => {
            const mockAdapter = jest.fn();
            mockAdapter.mockResolvedValue({});
            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });
            const requestContext: AdapterRequestContext = {
                cachePolicy: {
                    type: 'no-cache',
                },
            };
            const config: any = {};
            await instrumentedAdapter(config, requestContext);
            expect(mockAdapter).toHaveBeenCalledWith(config, requestContext);
        });

        it('does not send request context to the adapter', async () => {
            const mockAdapter = jest.fn();
            mockAdapter.mockResolvedValue({});
            const instrumentedAdapter = instrumentation.instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });
            const config: any = {};
            await instrumentedAdapter(config);
            expect(mockAdapter).toHaveBeenCalledWith(config, undefined);
        });
    });

    describe('weakETagZero', () => {
        it('should aggregate weaketagzero events and execute in beforeunload', () => {
            instrumentation.aggregateWeakETagEvents(true, false, 'Account');
            expect((instrumentation as any).weakEtagZeroEvents).toEqual({
                'weaketag-0-Account': {
                    'existing-weaketag-0': 0,
                    'incoming-weaketag-0': 1,
                },
            });

            window.dispatchEvent(new Event('beforeunload'));
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
            instrumentation.handleRefreshApiCall(REFRESH_APEX_KEY);
            expect((instrumentation as any).refreshApiCallEventStats[REFRESH_APEX_KEY]).toEqual(1);
            expect((instrumentation as any).lastRefreshApiCall).toEqual(REFRESH_APEX_KEY);
        });

        it('should increment refreshUiApi call count, and set lastRefreshApiCall', () => {
            instrumentation.handleRefreshApiCall(REFRESH_UIAPI_KEY);
            expect((instrumentation as any).refreshApiCallEventStats[REFRESH_UIAPI_KEY]).toEqual(1);
            expect((instrumentation as any).lastRefreshApiCall).toEqual(REFRESH_UIAPI_KEY);
        });

        it('should increment supported and per adapter counts for apex adapter', () => {
            instrumentation.handleRefreshApiCall(REFRESH_APEX_KEY);
            // comes from lwc-luvio
            instrumentation.instrumentLuvio(apexAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(1);
            expect(
                (instrumentation as any).refreshAdapterEvents[NORMALIZED_APEX_ADAPTER_NAME]
            ).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(1);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(0);
        });

        it('should increment unsupported and per adapter counts for non-apex adapter', () => {
            instrumentation.handleRefreshApiCall(REFRESH_APEX_KEY);
            // comes from lwc-luvio
            instrumentation.instrumentLuvio(uiApiAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(1);
            expect((instrumentation as any).refreshAdapterEvents[GET_RECORD_ADAPTER_NAME]).toEqual(
                1
            );
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(1);
        });

        it('should increment unsupported and per adapter counts for non-apex adapter when refreshUiApi is called', () => {
            instrumentation.handleRefreshApiCall(REFRESH_UIAPI_KEY);
            instrumentation.instrumentLuvio(uiApiAdapterRefreshEvent);
            instrumentation.handleRefreshApiCall(REFRESH_UIAPI_KEY);
            instrumentation.instrumentLuvio(apexAdapterRefreshEvent);
            expect(instrumentationSpies.aggregateRefreshAdapterEvents).toHaveBeenCalledTimes(2);
            expect((instrumentation as any).refreshApiCallEventStats[SUPPORTED_KEY]).toEqual(0);
            expect((instrumentation as any).refreshApiCallEventStats[UNSUPPORTED_KEY]).toEqual(2);
        });

        it('should reset stat trackers after call to logRefreshStats', () => {
            instrumentation.handleRefreshApiCall(REFRESH_APEX_KEY);
            instrumentation.instrumentLuvio(apexAdapterRefreshEvent);
            instrumentation.handleRefreshApiCall(REFRESH_UIAPI_KEY);
            instrumentation.instrumentLuvio(uiApiAdapterRefreshEvent);
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
        it('incrementAdapterRequestErrorCount called through instrumentLuvio function', () => {
            const o11yInstrumentLuvioSpy = jest.spyOn(ldsInstrumentation, 'instrumentLuvio');
            const context: AdapterUnfulfilledError = {
                [ADAPTER_UNFULFILLED_ERROR]: true,
                adapterName: 'fooAdapter',
                missingPaths: undefined,
                missingLinks: undefined,
            };
            instrumentation.instrumentLuvio(context);
            expect(o11yInstrumentLuvioSpy).toBeCalled();
            expect(instrumentationSpies.incrementAdapterRequestErrorCount).toBeCalled();
        });
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

            // Verify Metric Calls
            const expectedMetricCalls = [
                { owner: 'LIGHTNING.lds.service', name: 'request.Apex.getApex' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
                { owner: 'LIGHTNING.lds.service', name: 'request.Apex.getApex' },
                { owner: 'LIGHTNING.lds.service', name: 'request' },
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
});
