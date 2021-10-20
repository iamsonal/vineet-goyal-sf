/**
 * @jest-environment jsdom
 */

import { Adapter, Store } from '@luvio/engine';
import timekeeper from 'timekeeper';
import { flushPromises } from '@salesforce/lds-jest';

import {
    setupInstrumentation,
    incrementCounterMetric,
    instrumentAdapter,
    instrumentMethods,
    logAdapterCacheMissOutOfTtlDuration,
    updatePercentileHistogramMetric,
    Instrumentation,
    NORMALIZED_APEX_ADAPTER_NAME,
    REFRESH_APEX_KEY,
    REFRESH_UIAPI_KEY,
    SUPPORTED_KEY,
    UNSUPPORTED_KEY,
} from '../main';
import { REFRESH_ADAPTER_EVENT } from '@luvio/lwc-luvio';
import { stableJSONStringify } from '../utils/utils';
import { LRUCache } from '../utils/lru-cache';

jest.mock('o11y/client');
import { instrumentation as o11yInstrumentation } from 'o11y/client';
const o11yInstrumentationSpies = {
    trackValue: jest.spyOn(o11yInstrumentation, 'trackValue'),
    incrementCounter: jest.spyOn(o11yInstrumentation, 'incrementCounter'),
    startActivity: jest.spyOn(o11yInstrumentation, 'startActivity'),
};

const instrumentation = new Instrumentation();

const instrumentationSpies = {
    aggregateWeakETagEvents: jest.spyOn(instrumentation, 'aggregateWeakETagEvents'),
    aggregateRefreshAdapterEvents: jest.spyOn(instrumentation, 'aggregateRefreshAdapterEvents'),
    incrementRecordApiNameChangeEvents: jest.spyOn(
        instrumentation,
        'incrementRecordApiNameChangeCount'
    ),
};

beforeEach(() => {
    jest.clearAllMocks();
    (instrumentation as any).adapterCacheMisses = new LRUCache(250);
    // (instrumentation as any).resetRefreshStats();
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
    const actualCalls = metricSpy.mock.calls;
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

describe('instrumentMethods', () => {
    it('instruments a single method', () => {
        const foo = {
            bar: jest.fn(),
        };
        instrumentMethods(foo, ['bar']);
        foo.bar();
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
    });
    it('instruments multiple methods', () => {
        const foo = {
            bar: jest.fn(),
            baz: jest.fn(),
        };
        instrumentMethods(foo, ['bar', 'baz']);
        foo.bar();
        foo.baz();
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(2);
    });
    it('instruments an asynchronous method', async () => {
        const bar = jest.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({}));
            });
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        await foo.bar();
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
    });
    it('handles an asynchronous reject', async () => {
        const bar = jest.fn().mockImplementation(() => {
            return new Promise((_resolve, reject) => {
                setTimeout(() => reject());
            });
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        try {
            await foo.bar();
        } catch {
            await flushPromises();
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
        }
    });
    it('handles a synchronous throw', () => {
        const bar = jest.fn().mockImplementation(() => {
            throw new Error('mockError');
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        try {
            foo.bar();
        } catch {
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
        }
    });
});

describe('incrementCounterMetric', () => {
    it('should increment `foo` counter by 1, when value not specified', () => {
        incrementCounterMetric('foo');
        expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(1);
    });
    it('should increment `foo` counter by 100', () => {
        incrementCounterMetric('foo', 100);
        expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(1);
        expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledWith('foo', 100);
    });
});

describe('updatePercentileHistogramMetric', () => {
    it('should update `foo` metric by 10', () => {
        updatePercentileHistogramMetric('foo', 10);
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledWith('foo', 10);
    });
});

describe('instrumentation', () => {
    xdescribe('cache misses out of ttl', () => {
        it('should not log metrics when getRecord adapter has a cache hit on existing value within TTL', async () => {
            const mockGetRecordAdapter: any = (config) => {
                if (config.cacheHit) {
                    return {};
                } else {
                    return new Promise((resolve) => {
                        setTimeout(() => resolve({}));
                    });
                }
            };
            const instrumentedAdapter = instrumentAdapter(mockGetRecordAdapter, {
                apiFamily: 'UiApi',
                name: 'getRecord',
                ttl: GET_RECORD_TTL,
            });
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

            // const recordKey = 'UiApi.getRecord:' + stableJSONStringify(getRecordConfig);
            // Cache Miss #1
            const now = Date.now();
            timekeeper.freeze(now);
            const snapshotPromise = instrumentedAdapter(getRecordConfig);

            // no metric incremented
            // called with

            await snapshotPromise;

            // Cache Hit
            // Expected: all cache miss metrics stay unchanged.
            instrumentedAdapter(getRecordConfigCacheHit);

            // Expected ^

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.UiApi.getRecord', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.UiApi.getRecord', 1],
                ['request.UiApi.getRecord', 1],
                ['request', 1],
                ['cache-hit-count', 1],
                ['cache-hit-count.UiApi.getRecord', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });

        it('should not log metrics when adapter with no TTL defined has a cache miss on existing value out of TTL', () => {
            const unknownAdapter: any = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = instrumentAdapter(unknownAdapter, {
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
            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(0);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(0);

            // Cache Miss #2
            instrumentedAdapter(adapterConfig);
            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(0);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(0);

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.unknownApiFamily.unknownAdapter', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.unknownApiFamily.unknownAdapter', 1],
                ['request.unknownApiFamily.unknownAdapter', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.unknownApiFamily.unknownAdapter', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });

        it('should log metrics when getRecord adapter has a cache miss on existing value out of TTL', () => {
            const mockGetRecordAdapter: any = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter = instrumentAdapter(mockGetRecordAdapter, {
                apiFamily: 'UiApi',
                name: 'getRecord',
                ttl: GET_RECORD_TTL,
            });
            const getRecordConfig = {
                optionalFields: ['Account.Id', 'Account.Name'],
                recordId: '00x000000000000018',
            };

            const recordKey = 'UiApi.getRecord:' + stableJSONStringify(getRecordConfig);

            // Cache Miss #1
            const now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(1);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Miss #2, outside of TTL
            instrumentedAdapter(getRecordConfig);

            // Verify
            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(2);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenLastCalledWith(30001);
            const updatedTimestamp = now + 30001;

            expect((instrumentation as any).adapterCacheMisses.size).toEqual(1);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(
                updatedTimestamp
            );

            // + 1 from logAdapterCacheMissOutOfTtlDuration
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement + 1
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.UiApi.getRecord', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.UiApi.getRecord', 1],
                ['request.UiApi.getRecord', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.UiApi.getRecord', 1],
                ['cache-miss-out-of-ttl-count.UiApi.getRecord', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
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

            const instrumentedAdapter = instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });

            await instrumentedAdapter({ cacheHit: false });

            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(4);
        });

        it('logs nothing when adapter returns null', async () => {
            const mockAdapter = (() => {
                return null;
            }) as Adapter<any, any>;

            const instrumentedAdapter = instrumentAdapter(mockAdapter, {
                apiFamily: 'UiApi',
                name: 'getFoo',
            });

            await instrumentedAdapter({});

            // technically we bump two counters for calls to the adapter
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(0);
        });
    });

    xdescribe('weakETagZero', () => {
        it('should aggregate weaketagzero events and execute in beforeunload', () => {
            instrumentation.aggregateWeakETagEvents(true, false, 'Account');
            expect((instrumentation as any).weakEtagZeroEvents).toEqual({
                'weaketag-0-Account': {
                    'existing-weaketag-0': 0,
                    'incoming-weaketag-0': 1,
                },
            });

            // TODO [W-9782972]: need periodic logger
            // window.dispatchEvent(new Event('beforeunload'));
            // expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(1);
            // expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(1);
        });
    });

    // TODO [W-9782972]: Still determining if we need to move this to o11y
    xdescribe('recordApiNameChange', () => {
        it('should increment record apiName change counter', () => {
            instrumentation.incrementRecordApiNameChangeCount('', 'foo');
        });
    });

    // TODO [W-9782972]: Still determining if we need to move this to o11y
    xdescribe('refresh call events', () => {
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

    // TODO [W-9782972]: this will need done function
    describe('Observability metrics', () => {
        it('should instrument error when UnfulfilledSnapshot is returned to the adapter', () => {
            const mockGetRecordAdapter: any = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({ state: 'Unfulfilled' }));
                });
            };
            const instrumentedAdapter: any = instrumentAdapter(mockGetRecordAdapter, {
                apiFamily: 'UiApi',
                name: 'getRecord',
                ttl: GET_RECORD_TTL,
            });
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then((_result) => {
                // Verify Metric Calls
                const expectedMetricCalls = [
                    ['request.UiApi.getRecord', 1],
                    ['request', 1],
                    ['cache-miss-count', 1],
                    ['cache-miss-count.UiApi.getRecord', 1],
                ];
                testMetricInvocations(
                    o11yInstrumentationSpies.incrementCounter,
                    expectedMetricCalls
                );
            });
        });

        it('should not instrument error when an invalid config is provided', () => {
            const mockGetRecordAdapter = () => {
                return null;
            };
            const instrumentedAdapter = instrumentAdapter(mockGetRecordAdapter, {
                apiFamily: 'UiApi',
                name: 'getRecord',
                ttl: GET_RECORD_TTL,
            });
            const getRecordConfig = {
                recordId: 'not a valid id',
                optionalFields: 'also invalid',
            };

            var now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.UiApi.getRecord', 1],
                ['request', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });

        it('should not instrument error when a non UnfulfilledSnapshot Promise is returned to the adapter', () => {
            const mockGetRecordAdapter: any = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };
            const instrumentedAdapter: any = instrumentAdapter(mockGetRecordAdapter, {
                apiFamily: 'UiApi',
                name: 'getRecord',
                ttl: GET_RECORD_TTL,
            });
            const getRecordConfig = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Name', 'Account.Id'],
            };

            var now = Date.now();
            timekeeper.freeze(now);
            return instrumentedAdapter(getRecordConfig).then((_result) => {
                // Verify Metric Calls
                const expectedMetricCalls = [
                    ['request.UiApi.getRecord', 1],
                    ['request', 1],
                    ['cache-miss-count', 1],
                    ['cache-miss-count.UiApi.getRecord', 1],
                ];
                testMetricInvocations(
                    o11yInstrumentationSpies.incrementCounter,
                    expectedMetricCalls
                );
            });
        });
    });

    describe('getApex cardinality', () => {
        it('should aggregate all dynamic metrics under getApex', () => {
            const mockGetApexAdapter: any = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({}));
                });
            };

            const instrumentedGetApexAdapterOne = instrumentAdapter(mockGetApexAdapter, {
                apiFamily: 'Apex',
                name: 'getApex__ContactController_getContactList_false',
            });
            const instrumentedGetApexAdapterTwo = instrumentAdapter(mockGetApexAdapter, {
                apiFamily: 'Apex',
                name: 'getApex__AccountController_getAccountList_true',
            });

            expect(instrumentedGetApexAdapterOne.name).toEqual(
                'getApex__ContactController_getContactList_false__instrumented'
            );
            expect(instrumentedGetApexAdapterTwo.name).toEqual(
                'getApex__AccountController_getAccountList_true__instrumented'
            );

            instrumentedGetApexAdapterOne({ name: 'LDS', foo: 'bar' });
            instrumentedGetApexAdapterTwo({ name: 'LDS', foo: 'baz' });

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.Apex.getApex', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.Apex.getApex', 1],
                ['request.Apex.getApex', 1],
                ['request', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.Apex.getApex', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
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

            const instrumentedAdapter = instrumentAdapter(mockAdapter, {
                apiFamily: 'gql',
                name: 'graphQL',
            });

            await instrumentedAdapter({ cacheHit: true });

            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);

            // 4 standard counters + 1 for gql counter
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(5);
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

            const instrumentedAdapter = instrumentAdapter(mockAdapter, {
                apiFamily: 'gql',
                name: 'graphQL',
            });

            await instrumentedAdapter({ cacheHit: false });

            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);

            // 4 standard counters + 1 for gql counter
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(5);
        });
    });
});

describe('setupInstrumentation', () => {
    xdescribe('sets up luvio store methods', () => {
        // TODO [W-9782972]: does not use Activity any more, update
        it('instruments luvio store methods with o11y', () => {
            // Setup
            const mockLuvio: any = {
                storeBroadcast: jest.fn,
                storeIngest: jest.fn,
                storeLookup: jest.fn,
            };
            // jest.spyOn(o11yInstrumentation, 'startActivity');
            // jest.spyOn(o11yActivity, 'stop');

            // Exercise
            setupInstrumentation(mockLuvio, undefined);
            mockLuvio.storeBroadcast();
            mockLuvio.storeIngest();
            mockLuvio.storeLookup();

            // Verify
            // expect(o11yInstrumentationSpies.startActivity).toHaveBeenCalledTimes(3);
            // expect(o11yActivity.stop).toHaveBeenCalledTimes(3);
        });
    });
    xdescribe('sets store scheduler', () => {
        it('adds instrumentation with default scheduler', async () => {
            const luvio = {} as any;
            const store = new Store();
            setupInstrumentation(luvio, store);
            expect(store.scheduler).toBeDefined();
            // dummy trim task returning 5 trimmed entries
            await store.scheduler(() => 5);

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(1);
            // expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledWith('store-trim-task');
            // expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledWith('store-trim-task', {
            //     'store-trimmed-count': 5,
            // });
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalled();
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

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(1);
            // expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledWith('store-trim-task');
            // expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledWith('store-trim-task', {
            //     'store-trimmed-count': 5,
            // });
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalled();
        });

        it('no-ops with no-op scheduler', () => {
            const luvio = {} as any;
            // store with custom no-op scheduler
            const store = new Store({ scheduler: () => {} });
            setupInstrumentation(luvio, store);
            // dummy trim task returning 5 trimmed entries
            store.scheduler(() => 5);

            expect(o11yInstrumentationSpies.incrementCounter).not.toHaveBeenCalled();
            // expect(instrumentationServiceSpies.perfStart).not.toHaveBeenCalled();
            // expect(instrumentationServiceSpies.perfEnd).not.toHaveBeenCalled();
            expect(o11yInstrumentationSpies.trackValue).not.toHaveBeenCalled();
        });
    });
});
