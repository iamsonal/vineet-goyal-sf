declare module 'instrumentation/service' {
    export interface CacheStatsLogger {
        logHits(count?: number): void;
        logMisses(count?: number): void;
    }

    export interface MetricsServiceMark {
        ns: string;
        name: string;
        phase: string;
        ts: number;
        context: any;
    }

    export interface MetricsServicePlugin {
        name: string;
        enabled: boolean;
        initialize(): void;
        postProcess(marks: MetricsServiceMark[]): MetricsServiceMark[];
    }

    export interface MetricsKey {
        get(): { name: string; owner: string };
    }

    export interface Counter {
        increment(value?: number): void;
        decrement(value?: number): void;
        getValue(): number;
        reset(): void;
    }

    export interface Gauge {
        setValue(value: number): void;
        getValue(): number;
        reset(): void;
    }

    export interface PercentileHistogram {
        update(value: number): void;
        getValue(): number[];
        reset(): void;
    }

    export interface Timer {
        addDuration(valueInMs: number): void;
        getValue(): number[];
        time(callback: () => any): void;
    }

    export function time(): number;

    export function mark(namespace: string, name: string, context?: any): void;
    export function markStart(namespace: string, name: string, context?: any): void;
    export function markEnd(namespace: string, name: string, context?: any): void;

    export function registerPlugin(config: { name: string; plugin: MetricsServicePlugin }): void;
    export function registerCacheStats(name: string): CacheStatsLogger;
    export function registerPeriodicLogger(name: string, callback: () => void): void;

    export function counter(metricsKey: MetricsKey): Counter;
    export function gauge(metricsKey: MetricsKey): Gauge;
    export function percentileHistogram(metricsKey: MetricsKey): PercentileHistogram;
    export function timer(metricsKey: MetricsKey): Timer;
}
