import { getInstrumentation } from 'o11y/client';
import type { ReporterType } from './observability';
import { O11Y_NAMESPACE_LDS_MOBILE } from './observability';
import { GRAPHQL_ADAPTER_COUNT } from '../metric-keys';

export const ERROR_CODE = {
    GRAPHQL_QUERY_PARSE_ERROR: 'gql-query-parse-error',
};

export class ErrorReporter {
    reporter: ReporterType;

    constructor(reporter?: ReporterType) {
        if (reporter === undefined) {
            // Default to lds mobile reporter
            this.reporter = getInstrumentation(O11Y_NAMESPACE_LDS_MOBILE);
        } else {
            // Useful in tests
            this.reporter = reporter;
        }
    }

    reportGraphqlQueryParseError(err: Error) {
        this.reporter.incrementCounter(
            GRAPHQL_ADAPTER_COUNT,
            1, // value
            true, // hasError
            {
                errorCode: ERROR_CODE.GRAPHQL_QUERY_PARSE_ERROR,
            }
        );

        this.reporter.error(err, ERROR_CODE.GRAPHQL_QUERY_PARSE_ERROR);
    }
}
