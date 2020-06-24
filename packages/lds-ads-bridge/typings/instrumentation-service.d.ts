declare module 'instrumentation/service' {
    export interface MetricsKey {
        get(): { name: string; owner: string };
    }

    export function timer(metricsKey: MetricsKey): Timer;
}
