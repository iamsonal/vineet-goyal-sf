import { ReporterType, withInstrumentation } from '../../utils/observability';

describe('observabilityUtils', () => {
    describe('withInstrumentation', () => {
        let mockReporter;
        const incrementCounterSpy = jest.fn().mockName('incrementCounterSpy');
        const errorSpy = jest.fn().mockName('errorSpy');

        beforeAll(() => {
            mockReporter = {
                incrementCounter: incrementCounterSpy,
                error: errorSpy,
            } as unknown as ReporterType;
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should execute the operation', async () => {
            // Arrange
            const operation = jest.fn().mockResolvedValue('value');

            // Act
            const response = await withInstrumentation(mockReporter)(operation);

            // Assert
            expect(operation).toBeCalledTimes(1);
            expect(response).toBe('value');
        });

        it('should throw when promise rejects', async () => {
            // Arrange
            const operation = jest.fn().mockRejectedValue(new Error('some-error'));

            // Act && Assert
            await expect(withInstrumentation(mockReporter)(operation)).rejects.toThrow(
                'some-error'
            );
        });

        it('should report metrics to the instrumentation service', async () => {
            // Arrange
            const operation = jest.fn().mockResolvedValue('value');

            // Act
            await withInstrumentation(mockReporter)(operation, {
                tags: {
                    key: 'value',
                },
                metricName: 'my-metric',
            });

            // Assert
            expect(incrementCounterSpy).toHaveBeenCalledTimes(1);
            expect(incrementCounterSpy).toBeCalledWith('my-metric', 1, false, { key: 'value' });
        });

        it('should not report metrics if config is not passed', async () => {
            // Arrange
            const operation = jest.fn().mockResolvedValue('value');

            // Act
            await withInstrumentation(mockReporter)(operation);

            // Assert
            expect(incrementCounterSpy).toHaveBeenCalledTimes(0);
        });

        it('should not report errors', async () => {
            // Arrange
            const error = new Error('some-error');
            const operation = jest.fn().mockRejectedValue(error);

            // Act
            await expect(
                withInstrumentation(mockReporter)(operation, {
                    tags: {
                        key: 'value',
                    },
                    metricName: 'my-metric',
                })
            ).rejects.toThrow(error);

            // Assert
            expect(incrementCounterSpy).toHaveBeenCalledTimes(1);
            expect(incrementCounterSpy).toBeCalledWith('my-metric', 1, true, { key: 'value' });
            expect(errorSpy).toBeCalledTimes(1);
            expect(errorSpy).toBeCalledWith(error);
        });
    });
});
