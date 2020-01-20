import { LDS, Store, Adapter } from '@salesforce-lds/engine';
import {
    time,
    mark as instrumentationServiceMark,
    markStart,
    markEnd,
    registerCacheStats,
    registerPlugin,
    registerPeriodicLogger,
    MetricsServiceMark,
    MetricsServicePlugin,
    CacheStatsLogger,
} from 'instrumentation/service';

import { ObjectKeys } from '../utils/language';

interface LdsStatsReport {
    recordCount: number;
    subscriptionCount: number;
}

const NAMESPACE = 'lds';
const STORE_STATS_MARK_NAME = 'store-stats';
const RUNTIME_PERF_MARK_NAME = 'runtime-perf';

/**
 * Aura Metrics Service plugin in charge of aggregating all the LDS performance marks before they
 * get sent to the server. All the marks are summed by operation type and the aggregated result
 * is then stored an a new mark.
 */
const markAggregatorPlugin: MetricsServicePlugin = {
    name: NAMESPACE,
    enabled: true,
    initialize() {
        /* noop */
    },
    postProcess(marks: MetricsServiceMark[]): MetricsServiceMark[] {
        const postProcessedMarks: MetricsServiceMark[] = [];

        let shouldLogAggregated = false;
        const startTs: Record<string, number> = {};
        const aggregated: Record<string, number> = {};

        for (let i = 0, len = marks.length; i < len; i++) {
            const mark = marks[i];
            const { name, phase, ts } = mark;

            if (phase === 'start') {
                startTs[name] = ts;
            } else if (phase === 'end') {
                if (aggregated[name] === undefined) {
                    aggregated[name] = 0;
                }

                shouldLogAggregated = true;
                aggregated[name] += ts - startTs[name];
            } else {
                postProcessedMarks.push(mark);
            }
        }

        if (shouldLogAggregated) {
            postProcessedMarks.push({
                ns: NAMESPACE,
                name: RUNTIME_PERF_MARK_NAME,
                phase: 'stamp',
                ts: time(),
                context: aggregated,
            });
        }

        return postProcessedMarks;
    },
};

function instrumentMethod(obj: any, methodNames: string[]): void {
    for (let i = 0, len = methodNames.length; i < len; i++) {
        const methodName = methodNames[i];
        const originalMethod = obj[methodName];

        obj[methodName] = function(...args: any[]): any {
            markStart(NAMESPACE, methodName);
            const res = originalMethod.call(this, ...args);
            markEnd(NAMESPACE, methodName);

            return res;
        };
    }
}

function getStoreStats(store: Store): LdsStatsReport {
    const { records, snapshotSubscriptions, watchSubscriptions } = store;

    const recordCount = ObjectKeys(records).length;
    const subscriptionCount =
        ObjectKeys(snapshotSubscriptions).length + ObjectKeys(watchSubscriptions).length;

    return {
        recordCount,
        subscriptionCount,
    };
}

/**
 * Add a mark to the metrics service.
 *
 * @param name The mark name.
 * @param content The mark content.
 */
export function mark(name: string, content?: any) {
    instrumentationServiceMark(NAMESPACE, name, content);
}

/**
 * Create a new instrumentation cache stats and return it.
 *
 * @param name The cache logger name.
 */
export function registerLdsCacheStats(name: string): CacheStatsLogger {
    return registerCacheStats(`${NAMESPACE}:${name}`);
}

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param lds The LDS to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(lds: LDS, store: Store): void {
    registerPlugin({
        name: NAMESPACE,
        plugin: markAggregatorPlugin,
    });

    instrumentMethod(lds, ['storeLookup', 'storeIngest', 'storeBroadcast']);

    registerPeriodicLogger(NAMESPACE, () => {
        const storeStats = getStoreStats(store);
        instrumentationServiceMark(NAMESPACE, STORE_STATS_MARK_NAME, storeStats);
    });
}

/**
 * Instrument an existing adapter that would logs the cache hits and misses.
 *
 * @param name The adapter name.
 * @param adapter The adapter function.
 * @returns The wrapped adapter.
 */
export function instrumentAdapter<C, D>(name: string, adapter: Adapter<C, D>): Adapter<C, D> {
    const stats = registerLdsCacheStats(name);

    return (config: C) => {
        const result = adapter(config);

        // In the case where the adapter returns a Snapshot it is constructed out of the store
        // (cache hit) whereas a Promise<Snapshot> indicates a network request (cache miss).
        //
        // Note: we can't do a plain instanceof check for a promise here since the Promise may
        // originate from another javascript realm (for example: in jest test). Instead we use a
        // duck-typing approach by checking is the result has a then property.
        //
        // For adapters without persistant store:
        //  - total cache hit ratio:
        //      [in-memory cache hit count] / ([in-memory cache hit count] + [in-memory cache miss count])
        // For adapters with persistant store:
        //  - in-memory cache hit ratio:
        //      [in-memory cache hit count] / ([in-memory cache hit count] + [in-memory cache miss count])
        //  - total cache hit ratio:
        //      ([in-memory cache hit count] + [store cache hit count]) / ([in-memory cache hit count] + [in-memory cache miss count])
        //

        // if result === null then config is insufficient/invalid so do not log
        if (result !== null) {
            if ('then' in result) {
                stats.logMisses();
            } else {
                stats.logHits();
            }
        }

        return result;
    };
}
