declare module 'instrumentation/service' {
    export interface CacheStatsLogger {
        logHits(count?: number): void;
        logMisses(count?: number): void;
    }
}
