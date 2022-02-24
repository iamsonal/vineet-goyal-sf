import { ErrorReporter, ERROR_CODE } from '../../utils/ErrorReporter';
import type { ReporterType } from '../../utils/observability';
import { GRAPHQL_ADAPTER_COUNT } from '../../metric-keys';

describe('observability', () => {
    describe('ErrorReporter', () => {
        it('should report graphql errors', () => {
            // Arrange
            const mockIncrementCounter = jest.fn().mockName('mockIncrementCounter');
            const mockError = jest.fn().mockName('mockError');
            const reporter = {
                incrementCounter: mockIncrementCounter,
                error: mockError,
            } as unknown as ReporterType;

            const errorReporter = new ErrorReporter(reporter);

            const error = new Error('something really bad happened');

            // Act
            errorReporter.reportGraphqlQueryParseError(error);

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
    });
});
