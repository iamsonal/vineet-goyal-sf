export const instrumentation = {
    instrumentLuvio: function () {},
};
export function instrumentAdapter() {}
export function setupInstrumentation() {}
export const METRIC_KEYS = {
    DURABLE_STORE_COUNT: 'durable-store-count',
};

export const withInstrumentation = () => undefined;

export class MetricsReporter {
    reportGraphqlQueryParseError() {}
    reportGraphqlSqlEvalPreconditionError() {}
    reportGraphqlCreateSnapshotError() {}
    reportGraphqlAdapterSuccess() {}
}
