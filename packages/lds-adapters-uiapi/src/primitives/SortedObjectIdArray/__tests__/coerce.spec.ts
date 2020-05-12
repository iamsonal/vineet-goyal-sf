import coerce from '../coerce';

describe('ObjectIdArray coercion', () => {
    it('should return undefined for undefined', () => {
        expect(coerce(undefined)).toBe(undefined);
    });

    it('should return undefined for invalid input', () => {
        expect(coerce('')).toBe(undefined);
    });

    it('should return undefined for empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });

    it('should return undefined for an array with empty string', () => {
        expect(coerce([''])).toEqual(undefined);
    });

    it('should return undefined when a single item is invalid', () => {
        expect(coerce(['ObjectX', undefined, { objectApiName: 'ObjectA' }])).toEqual(undefined);
    });

    it('should return sorted array when passed single valid object name', () => {
        expect(coerce('ObjectX')).toEqual(['ObjectX']);
    });

    it('should return sorted array when passed multiple valid object names', () => {
        expect(coerce(['ObjectX', { objectApiName: 'ObjectA' }])).toEqual(['ObjectA', 'ObjectX']);
    });

    it('should return sorted deduped array when passed duplicate valid object names', () => {
        expect(coerce(['ObjectX', 'ObjectX', { objectApiName: 'ObjectA' }])).toEqual([
            'ObjectA',
            'ObjectX',
        ]);
    });
});
