/**
 * @jest-environment jsdom
 */

import { Instrumentation } from '../main';
import { getRecordConfigKey } from '../config-key-functions';
import timekeeper from 'timekeeper';

jest.mock('instrumentation/service', () => {
    const spies = {
        cacheStatsLogHitsSpy: jest.fn(),
        cacheStatsLogMissesSpy: jest.fn(),
        counterIncrementSpy: jest.fn(),
        percentileUpdateSpy: jest.fn(),
        perfEnd: jest.fn(),
        perfStart: jest.fn(),
        timerAddDurationSpy: jest.fn(),
    };

    return {
        counter: () => ({
            increment: spies.counterIncrementSpy,
        }),
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
    logAdapterCacheMissDuration: jest.spyOn(instrumentation, 'logAdapterCacheMissDuration'),
};

beforeEach(() => {
    instrumentationSpies.aggregateWeakETagEvents.mockClear();
    instrumentationSpies.logAdapterCacheMissDuration.mockClear();
    instrumentationServiceSpies.perfEnd.mockClear();
    instrumentationServiceSpies.perfStart.mockClear();
    instrumentationServiceSpies.timerAddDurationSpy.mockClear();
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
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Hit
            instrumentedAdapter(getRecordConfigCacheHit);
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
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
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);

            // Cache Miss #2
            instrumentedAdapter(adapterConfig);
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(0);
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
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.timerAddDurationSpy).toHaveBeenCalledTimes(0);
            expect((instrumentation as any).adapterCacheMisses.get(recordKey)).toEqual(now);

            // Fast forward out of TTL for record
            timekeeper.travel(now + 30001);

            // Cache Miss #2, outside of TTL
            instrumentedAdapter(getRecordConfig);
            expect(instrumentationSpies.logAdapterCacheMissDuration).toHaveBeenCalledTimes(2);
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

        it('should immediately log when instrumentNetwork is called with any other event ', () => {
            const context = {
                random: 'event',
            };
            instrumentation.instrumentNetwork(context);
            expect(instrumentationSpies.aggregateWeakETagEvents).toHaveBeenCalledTimes(0);
            expect(instrumentationServiceSpies.perfStart).toHaveBeenCalledTimes(1);
            expect(instrumentationServiceSpies.perfEnd).toHaveBeenCalledTimes(1);
        });
    });
});
