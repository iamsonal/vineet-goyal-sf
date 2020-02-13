import coerce from '../coerce';

describe('FieldIdArray coercion', () => {
    it('should return undefined for undefined', () => {
        expect(coerce(undefined)).toEqual(undefined);
    });

    it('should return undefined for empty string', () => {
        expect(coerce('')).toBe(undefined);
    });

    it('should return undefined for empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });

    it('should return undefined for an array with empty string', () => {
        expect(coerce([''])).toEqual(undefined);
    });

    it('should return undefined when a single item is invalid', () => {
        expect(coerce(['X', undefined, { objectApiName: 'ObjectA', fieldApiName: 'Y' }])).toEqual(
            undefined
        );
    });

    it('should return array when passed single valid field name', () => {
        expect(coerce('FieldX')).toEqual(['FieldX']);
    });

    it('should return sorted array when passed multiple valid field names', () => {
        expect(coerce(['X', { objectApiName: 'ObjectA', fieldApiName: 'Y' }])).toEqual([
            'ObjectA.Y',
            'X',
        ]);
    });

    it('should return deduped sorted array when passed duplicate valid field names', () => {
        expect(coerce(['X', 'X', { objectApiName: 'ObjectA', fieldApiName: 'Y' }])).toEqual([
            'ObjectA.Y',
            'X',
        ]);
    });
});
