import { isNotAFunctionError } from '../error';

describe('error', () => {
    it('should return true if not a function error', () => {
        // Arrange
        let error = null;
        try {
            new error();
        } catch (err) {
            error = err;
        }

        // Act
        const result = isNotAFunctionError(error);

        // Assert
        expect(result).toBe(true);
    });

    it('should return false for normal errors', () => {
        // Arrange
        const error = new Error('some error');

        // Act
        const result = isNotAFunctionError(error);

        // Assert
        expect(result).toBe(false);
    });
});
