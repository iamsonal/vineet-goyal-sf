import timekeeper from 'timekeeper';

import { flushPromises } from '@salesforce/lds-jest';
import { Adapter, Store } from '@luvio/engine';

import {
    setupInstrumentation,
    incrementCounterMetric,
    instrumentAdapter,
    instrumentMethods,
    logAdapterCacheMissOutOfTtlDuration,
    updatePercentileHistogramMetric,
} from '../main';

jest.mock('o11y/client');
import { activity, instrumentation as o11yInstrumentation } from 'o11y/client';
const o11yInstrumentationSpies = {
    trackValue: jest.spyOn(o11yInstrumentation, 'trackValue'),
    incrementCounter: jest.spyOn(o11yInstrumentation, 'incrementCounter'),
    startActivity: jest.spyOn(o11yInstrumentation, 'startActivity'),
};
const o11yActivitySpies = {
    discard: jest.spyOn(activity, 'discard'),
    error: jest.spyOn(activity, 'error'),
    stop: jest.spyOn(activity, 'stop'),
};

beforeEach(() => {
    jest.clearAllMocks();
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
// - cachePolicyType or cachePolicyUndefined
const baseCacheHitCounterIncrement = 5;
const baseCacheMissCounterIncrement = 5;
const GET_RECORD_TTL = 30000;

describe('instrumentMethods', () => {
    it('instruments a single method', () => {
        const foo = {
            bar: jest.fn(),
        };
        const methods = [{ methodName: 'bar', metricKey: 'bar_metric' }];
        instrumentMethods(foo, methods);

        // freeze to guarantee that the second param to `trackValue` will be zero
        const now = Date.now();
        timekeeper.freeze(now);

        foo.bar();
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
        expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledWith('bar_metric', 0);
    });
    it('instruments multiple methods', () => {
        const foo = {
            bar: jest.fn(),
            baz: jest.fn(),
        };
        const methods = [
            { methodName: 'bar', metricKey: 'bar_metric' },
            { methodName: 'baz', metricKey: 'baz_metric' },
        ];
        instrumentMethods(foo, methods);
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
        const methods = [{ methodName: 'bar', metricKey: 'bar_metric' }];
        instrumentMethods(foo, methods);
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
        const methods = [{ methodName: 'bar', metricKey: 'bar_metric' }];
        instrumentMethods(foo, methods);
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
        const methods = [{ methodName: 'bar', metricKey: 'bar_metric' }];
        instrumentMethods(foo, methods);
        try {
            foo.bar();
        } catch {
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
        }
    });
});

describe('instrumentAdapter', () => {
    describe('adapter returning null', () => {
        const mockAdapter = ((_config) => {
            return null;
        }) as Adapter<any, any>;
        const instrumentedAdapter = instrumentAdapter(mockAdapter, {
            apiFamily: 'UiApi',
            name: 'getFoo',
        });

        it('does not increment cache hit or miss counters', () => {
            instrumentedAdapter({});

            const expectedMetricCalls = [
                ['request.UiApi.getFoo', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });
        it('does not track cache hit or miss durations', () => {
            instrumentedAdapter({});

            const expectedMetricCalls = [];
            testMetricInvocations(o11yInstrumentationSpies.trackValue, expectedMetricCalls);
        });
        it('discards activity', () => {
            instrumentedAdapter({});
            expect(o11yActivitySpies.discard).toHaveBeenCalled();
        });
    });
    describe('luvio store (L1) cache hit', () => {
        const mockAdapter = ((config, context) => {
            const observer = context.eventObservers[0];
            if (config.error === true) {
                throw new Error('error');
            }
            observer.onLuvioEvent({
                type: 'adapter-lookup-start',
                cachePolicy: config.cachePolicy,
            });
            observer.onLuvioEvent({ type: 'cache-lookup-start' });
            observer.onLuvioEvent({
                type: 'cache-lookup-end',
                wasResultAsync: false,
                hasError: false,
                snapshotState: 'Fulfilled',
            });
            observer.onLuvioEvent({ type: 'adapter-lookup-end', hasError: false });

            return {};
        }) as Adapter<any, any>;
        const instrumentedAdapter = instrumentAdapter(mockAdapter, {
            apiFamily: 'UiApi',
            name: 'getFoo',
        });
        it('increments cache hit counters', () => {
            instrumentedAdapter({});

            const expectedMetricCalls = [
                ['request.UiApi.getFoo', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
                ['cache-hit-count', 1],
                ['cache-hit-count.UiApi.getFoo', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });
        it('tracks cache hit duration', () => {
            timekeeper.freeze(Date.now());
            instrumentedAdapter({});

            const expectedMetricCalls = [['cache-hit-duration.UiApi.getFoo', 0]];
            testMetricInvocations(o11yInstrumentationSpies.trackValue, expectedMetricCalls);
        });
        it('discards activity', () => {
            instrumentedAdapter({});
            expect(o11yActivitySpies.discard).toHaveBeenCalled();
        });
        it('discards activity with error', () => {
            try {
                instrumentedAdapter({ error: true });
            } catch (error) {
                expect(o11yActivitySpies.discard).toHaveBeenCalled();
            }
        });
        xit('logs error', () => {});
    });
    describe('luvio store (L1) cache miss', () => {
        const mockAdapter = ((config, context) => {
            if (config.error === true) {
                return Promise.reject('adapter threw');
            } else {
                const observer = context.eventObservers[0];
                observer.onLuvioEvent({
                    type: 'adapter-lookup-start',
                    cachePolicy: config.cachePolicy,
                });
                observer.onLuvioEvent({ type: 'cache-lookup-start' });
                observer.onLuvioEvent({
                    type: 'cache-lookup-end',
                    wasResultAsync: false,
                    hasError: false,
                    snapshotState: 'Unfulfilled',
                });
                observer.onLuvioEvent({
                    type: 'network-lookup-start',
                });
                observer.onLuvioEvent({
                    type: 'network-lookup-end',
                    hasError: false,
                });
                observer.onLuvioEvent({ type: 'adapter-lookup-end', hasError: false });
                return Promise.resolve({} as any);
            }
        }) as Adapter<any, any>;
        const instrumentedAdapter = instrumentAdapter(mockAdapter, {
            apiFamily: 'UiApi',
            name: 'getFoo',
        });
        it('increments cache miss counters', async () => {
            await instrumentedAdapter({});

            const expectedMetricCalls = [
                ['request.UiApi.getFoo', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.UiApi.getFoo', 1],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });
        it('tracks cache miss duration', async () => {
            timekeeper.freeze(Date.now());
            await instrumentedAdapter({});

            const expectedMetricCalls = [['cache-miss-duration.UiApi.getFoo', 0]];
            testMetricInvocations(o11yInstrumentationSpies.trackValue, expectedMetricCalls);
        });
        it('calls activity.stop with "cache-miss"', async () => {
            await instrumentedAdapter({});
            await flushPromises();
            expect(o11yActivitySpies.stop).toHaveBeenCalled();
            expect(o11yActivitySpies.stop).toHaveBeenCalledWith('cache-miss');
        });
        it('calls activity.error and activity.stop with error', async () => {
            try {
                await instrumentedAdapter({ error: true });
            } catch (_error) {
                // swallow error here
            }
            await flushPromises();
            expect(o11yActivitySpies.error).toHaveBeenCalled();
            expect(o11yActivitySpies.stop).toHaveBeenCalled();
            expect(o11yActivitySpies.stop).toHaveBeenCalledWith('cache-miss');
        });
    });

    describe('durable store (L2) cache hit', () => {
        const mockAdapter = ((config, context) => {
            const observer = context.eventObservers[0];

            observer.onLuvioEvent({
                type: 'adapter-lookup-start',
                cachePolicy: config.cachePolicy,
            });
            observer.onLuvioEvent({ type: 'cache-lookup-start' });
            observer.onLuvioEvent({
                type: 'cache-lookup-end',
                wasResultAsync: true,
                hasError: false,
                snapshotState: config.isStale ? 'Stale' : 'Fulfilled',
            });
            observer.onLuvioEvent({ type: 'adapter-lookup-end', hasError: false });

            return {};
        }) as Adapter<any, any>;
        const instrumentedAdapter = instrumentAdapter(mockAdapter, {
            apiFamily: 'UiApi',
            name: 'getFoo',
        });

        it('increments L2 cache hit markers', () => {
            instrumentedAdapter({});

            const expectedMetricCalls = [
                ['request.UiApi.getFoo', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
                ['cache-hit-l2-count', 1, undefined, undefined],
                ['cache-hit-l2-count.UiApi.getFoo', 1, undefined, undefined],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });
        it('includes stale tag when data is stale', () => {
            instrumentedAdapter({ isStale: true });

            const expectedMetricCalls = [
                ['request.UiApi.getFoo', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
                ['cache-hit-l2-count', 1, undefined, { stale: true }],
                ['cache-hit-l2-count.UiApi.getFoo', 1, undefined, { stale: true }],
            ];
            testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
        });
    });
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
        expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(5);
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

    it('logs correct cache policy type when adapter is called with one', async () => {
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

        await instrumentedAdapter(
            { cacheHit: false },
            { cachePolicy: { type: 'cache-then-network' } }
        );

        const expectedMetricCalls = [
            ['request.UiApi.getFoo', 1],
            ['request', 1],
            ['cache-policy-cache-then-network', 1],
            ['cache-miss-count', 1],
            ['cache-miss-count.UiApi.getFoo', 1],
        ];
        testMetricInvocations(o11yInstrumentationSpies.incrementCounter, expectedMetricCalls);
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
                ['cache-policy-undefined', 2],
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

            // Cache Miss #1
            const now = Date.now();
            timekeeper.freeze(now);
            instrumentedAdapter(getRecordConfig);

            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(1);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(0);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Miss #2, outside of TTL
            instrumentedAdapter(getRecordConfig);

            // Verify
            expect(logAdapterCacheMissOutOfTtlDuration).toHaveBeenCalledTimes(2);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(1);
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenLastCalledWith(30001);

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
                    ['cache-policy-undefined', 1],
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
                ['cache-policy-undefined', 1],
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
                    ['cache-policy-undefined', 1],
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
        it('should aggregate all dynamic metrics under getApex', async () => {
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

            await instrumentedGetApexAdapterOne({ name: 'LDS', foo: 'bar' });
            await instrumentedGetApexAdapterTwo({ name: 'LDS', foo: 'baz' });

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(
                baseCacheMissCounterIncrement + baseCacheHitCounterIncrement
            );

            // Verify Metric Calls
            const expectedMetricCalls = [
                ['request.Apex.getApex', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
                ['cache-miss-count', 1],
                ['cache-miss-count.Apex.getApex', 1],
                ['request.Apex.getApex', 1],
                ['request', 1],
                ['cache-policy-undefined', 1],
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

            // 5 standard counters + 1 for gql counter
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(6);
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

            // 5 standard counters + 1 for gql counter
            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(6);
        });
    });
});

describe('setupInstrumentation', () => {
    describe('sets up luvio store methods', () => {
        it('instruments luvio store methods with o11y', () => {
            // Setup
            const mockLuvio: any = {
                storeBroadcast: jest.fn,
                storeIngest: jest.fn,
                storeLookup: jest.fn,
                storeSetTTLOverride: jest.fn,
                storeSetDefaultTTLOverride: jest.fn,
            };
            const store = new Store();

            // Exercise
            setupInstrumentation(mockLuvio, store);
            mockLuvio.storeBroadcast();
            mockLuvio.storeIngest();
            mockLuvio.storeLookup();
            mockLuvio.storeSetDefaultTTLOverride();
            mockLuvio.storeSetTTLOverride();

            // Verify
            expect(o11yInstrumentationSpies.trackValue).toHaveBeenCalledTimes(
                5 /* expectedCalls */ + 3 /* unrelatedCalls */
            );
        });
    });
    describe('collects store statistics', () => {
        it('provides the correct count for each of the store properties we instrument', () => {
            // Setup
            const mockLuvio: any = {
                storeBroadcast: jest.fn,
            };
            const store = new Store();

            // freeze to guarantee that the second param to `trackValue` will be zero
            // for store-broadcast-duration
            const now = Date.now();
            timekeeper.freeze(now);

            // Exercise
            setupInstrumentation(mockLuvio, store);
            mockLuvio.storeBroadcast();

            // Verify
            const expectedMetricCalls = [
                ['store-size-count', 0],
                ['store-snapshot-subscriptions-count', 0],
                ['store-watch-subscriptions-count', 0],
                ['store-broadcast-duration', 0],
            ];
            testMetricInvocations(o11yInstrumentationSpies.trackValue, expectedMetricCalls);
        });
    });
    describe('sets store scheduler', () => {
        it('adds instrumentation with default scheduler', async () => {
            const luvio = {} as any;
            const store = new Store();
            setupInstrumentation(luvio, store);
            expect(store.scheduler).toBeDefined();
            // dummy trim task returning 5 trimmed entries
            await store.scheduler(() => 5);

            expect(o11yInstrumentationSpies.incrementCounter).toHaveBeenCalledTimes(1);
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
            expect(o11yInstrumentationSpies.trackValue).not.toHaveBeenCalled();
        });
    });
});
