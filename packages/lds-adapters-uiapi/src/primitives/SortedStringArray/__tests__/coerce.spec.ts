import coerce from './../coerce';

describe('Sorted String array coercion', () => {
    it('should return undefined for invalid input', () => {
        expect(coerce(2)).toBe(undefined);
    });

    it('should return array when passed single string', () => {
        expect(coerce('A')).toEqual(['A']);
    });

    it('should return array when passed an array of strings', () => {
        expect(coerce(['A'])).toEqual(['A']);
    });

    it('should return sorted array when passed an array of multiple strings', () => {
        expect(coerce(['B', 'A'])).toEqual(['A', 'B']);
    });

    it('should return undefined if a single item in the array is invalid', () => {
        expect(coerce(['A', 2])).toBe(undefined);
    });

    it('should auto-dedupe the array', () => {
        expect(coerce(['A', 'A'])).toEqual(['A']);
    });
    it('should return undefined when passed empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });
});
