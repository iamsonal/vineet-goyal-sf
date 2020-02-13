import coerce from './../coerce';

describe('LayoutModeArray coercion', () => {
    it('should return undefined for invalid input', () => {
        expect(coerce('invalid')).toBe(undefined);
    });

    it('should return array when passed single valid Layout Mode', () => {
        expect(coerce('View')).toEqual(['View']);
    });

    it('should return sorted array when passed multiple valid Layout Modes', () => {
        expect(coerce(['View', 'Edit'])).toEqual(['Edit', 'View']);
    });

    it('should return undefined when a single item is invalid', () => {
        expect(coerce(['View', undefined, 'Edit'])).toEqual(undefined);
    });

    it('should return sorted deduped array when passed duplicate valid Layout Modes', () => {
        expect(coerce(['View', 'View', 'Edit'])).toEqual(['Edit', 'View']);
    });

    it('should return undefined when passed empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });
});
