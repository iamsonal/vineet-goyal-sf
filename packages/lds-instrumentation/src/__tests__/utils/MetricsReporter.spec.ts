import { MetricsReporter, ERROR_CODE, normalizeError } from '../../utils/MetricsReporter';
import type { ReporterType } from '../../utils/observability';
import { GRAPHQL_ADAPTER_COUNT } from '../../metric-keys';

const mockIncrementCounter = jest.fn().mockName('mockIncrementCounter');
const mockError = jest.fn().mockName('mockError');
const reporter = {
    incrementCounter: mockIncrementCounter,
    error: mockError,
} as unknown as ReporterType;

describe('MetricsReporter', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should report GraphQL query parse errors', () => {
        // Arrange
        const metricsReporter = new MetricsReporter(reporter);
        const error = new Error('something really bad happened');

        // Act
        metricsReporter.reportGraphqlQueryParseError(error);

        // Assert
        expect(mockError).toBeCalledTimes(1);
        expect(mockError).toBeCalledWith(error, ERROR_CODE.GRAPHQL_QUERY_PARSE_ERROR);

        expect(mockIncrementCounter).toBeCalledTimes(1);
        expect(mockIncrementCounter).toBeCalledWith(
            GRAPHQL_ADAPTER_COUNT,
            1,
            true, // hasError
            {
                errorCode: ERROR_CODE.GRAPHQL_QUERY_PARSE_ERROR,
            }
        );
    });

    it('should report GraphQL AST to SQL errors', () => {
        // Arrange
        const metricsReporter = new MetricsReporter(reporter);
        const error = new Error('something really bad happened');

        // Act
        metricsReporter.reportGraphqlSqlEvalPreconditionError(error);

        // Assert
        expect(mockError).toBeCalledTimes(1);
        expect(mockError).toBeCalledWith(error, ERROR_CODE.GRAPHQL_SQL_EVAL_PRECONDITION_ERROR);

        expect(mockIncrementCounter).toBeCalledTimes(1);
        expect(mockIncrementCounter).toBeCalledWith(
            GRAPHQL_ADAPTER_COUNT,
            1,
            true, // hasError
            {
                errorCode: ERROR_CODE.GRAPHQL_SQL_EVAL_PRECONDITION_ERROR,
            }
        );
    });

    it('should report GraphQL Create Snapshot errors', () => {
        // Arrange
        const metricsReporter = new MetricsReporter(reporter);
        const error = new Error('something really bad happened');

        // Act
        metricsReporter.reportGraphqlCreateSnapshotError(error);

        // Assert
        expect(mockError).toBeCalledTimes(1);
        expect(mockError).toBeCalledWith(error, ERROR_CODE.GRAPHQL_CREATE_SNAPSHOT_ERROR);

        expect(mockIncrementCounter).toBeCalledTimes(1);
        expect(mockIncrementCounter).toBeCalledWith(
            GRAPHQL_ADAPTER_COUNT,
            1,
            true, // hasError
            {
                errorCode: ERROR_CODE.GRAPHQL_CREATE_SNAPSHOT_ERROR,
            }
        );
    });

    it('should sucess metrics for GraphQL', () => {
        // Arrange
        const metricsReporter = new MetricsReporter(reporter);

        // Act
        metricsReporter.reportGraphqlAdapterSuccess();

        // Assert
        expect(mockIncrementCounter).toBeCalledTimes(1);
        expect(mockIncrementCounter).toBeCalledWith(
            GRAPHQL_ADAPTER_COUNT,
            1,
            false, // hasError
            {}
        );
    });
});

describe('normalizeError', () => {
    it('should return same object if an instance of Error is given', () => {
        // Arrange
        const err = new Error('some error');

        // Act
        const result = normalizeError(err);

        // Assert
        expect(result).toEqual(err);
    });

    it('should return Error if a string is given', () => {
        // Arrange
        const err = 'some error';

        // Act
        const result = normalizeError(err);

        // Assert
        expect(result).toEqual(new Error(err));
    });

    it('should stringify if an object is given', () => {
        // Arrange
        const err = {
            code: 404,
        };

        // Act
        const result = normalizeError(err);

        // Assert
        const expected = new Error(JSON.stringify(err));
        expect(result).toEqual(expected);
    });
});
