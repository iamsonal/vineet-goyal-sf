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

    export function time(): number;

    export function mark(namespace: string, name: string, context?: any): void;
    export function markStart(namespace: string, name: string, context?: any): void;
    export function markEnd(namespace: string, name: string, context?: any): void;

    export function registerPlugin(config: { name: string; plugin: MetricsServicePlugin }): void;
    export function registerCacheStats(name: string): CacheStatsLogger;
    export function registerPeriodicLogger(name: string, callback: () => void): void;
}
