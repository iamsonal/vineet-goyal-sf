import coerce from './../coerce';

describe('LayoutTypeArray coercion', () => {
    it('should return undefined for invalid input', () => {
        expect(coerce('invalid')).toBe(undefined);
    });

    it('should return array when passed single valid Layout Type', () => {
        expect(coerce('Full')).toEqual(['Full']);
    });

    it('should return sorted array when passed multiple valid Layout Types', () => {
        expect(coerce(['Full', 'Compact'])).toEqual(['Compact', 'Full']);
    });

    it('should return undefined when a single item is invalid', () => {
        expect(coerce(['Full', undefined, 'Compact'])).toEqual(undefined);
    });

    it('should return sorted unique array when passed duplicate valid Layout Types', () => {
        expect(coerce(['Full', 'Full', 'Compact'])).toEqual(['Compact', 'Full']);
    });

    it('should return undefined when passed empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });
});
