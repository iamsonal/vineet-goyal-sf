import coerceFormFactor from '../coerce';

describe('Form factor coerce', () => {
    it('should return undefined for invalid form factor', () => {
        expect(coerceFormFactor('invalid')).toBe(undefined);
    });

    it('should return Large for Large form factor', () => {
        expect(coerceFormFactor('Large')).toBe('Large');
    });

    it('should return Medium for Medium form factor', () => {
        expect(coerceFormFactor('Medium')).toBe('Medium');
    });

    it('should return Small for Small form factor', () => {
        expect(coerceFormFactor('Small')).toBe('Small');
    });
});
