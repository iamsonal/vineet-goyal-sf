import { getInstrumentation } from 'o11y/client';
import type { ReporterType } from './observability';
import { O11Y_NAMESPACE_LDS_MOBILE } from './observability';
import { GRAPHQL_ADAPTER_COUNT } from '../metric-keys';
import { JSONStringify } from './language';

export const ERROR_CODE = {
    GRAPHQL_QUERY_PARSE_ERROR: 'gql-query-parse-error',
    GRAPHQL_SQL_EVAL_PRECONDITION_ERROR: 'gql-sql-pre-eval-error',
    GRAPHQL_CREATE_SNAPSHOT_ERROR: 'gql-create-snapshot-error',
};

/**
 * Use this method to sanitize the unknown error object when
 * we are unsure of the type of the error thrown
 *
 * @param err Unknown object to sanitize
 * @returns an instance of error
 */
export function normalizeError(err: unknown): Error {
    if (err instanceof Error) {
        return err;
    } else if (typeof err === 'string') {
        return new Error(err);
    }

    return new Error(JSONStringify(err));
}

export class MetricsReporter {
    reporter: ReporterType;

    constructor(reporter?: ReporterType) {
        if (reporter === undefined) {
            this.reporter = getInstrumentation(O11Y_NAMESPACE_LDS_MOBILE);
        } else {
            // Useful in tests
            this.reporter = reporter;
        }
    }

    reportGraphqlQueryParseError(err: unknown): void {
        const error = normalizeError(err);
        const errorCode = ERROR_CODE.GRAPHQL_QUERY_PARSE_ERROR;
        // Metric
        this.reportGraphqlAdapterError(errorCode);

        // Log
        this.reporter.error(error, errorCode);
    }

    reportGraphqlSqlEvalPreconditionError(err: Error): void {
        const errorCode = ERROR_CODE.GRAPHQL_SQL_EVAL_PRECONDITION_ERROR;
        // Metric
        this.reportGraphqlAdapterError(errorCode);

        // Log
        this.reporter.error(err, errorCode);
    }

    reportGraphqlCreateSnapshotError(err: unknown): void {
        const error = normalizeError(err);

        const errorCode = ERROR_CODE.GRAPHQL_CREATE_SNAPSHOT_ERROR;
        // Metric
        this.reportGraphqlAdapterError(errorCode);

        // Log
        this.reporter.error(error, errorCode);
    }

    reportGraphqlAdapterSuccess() {
        // Increment overall count without error
        this.reporter.incrementCounter(
            GRAPHQL_ADAPTER_COUNT,
            1, // value
            false, // hasError

            // If needed, this method can accept some tags here and pass it along
            {}
        );
    }

    private reportGraphqlAdapterError(errorCode: string) {
        // Increment overall count with errorCode as tag
        this.reporter.incrementCounter(
            GRAPHQL_ADAPTER_COUNT,
            1, // value
            true, // hasError
            {
                errorCode,
            }
        );
    }
}
