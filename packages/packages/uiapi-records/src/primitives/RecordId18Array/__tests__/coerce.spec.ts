import coerce from './../coerce';

describe('Record 18 array coercion', () => {
    it('should return undefined for invalid input', () => {
        expect(coerce('invalid')).toBe(undefined);
    });

    it('should return array when passed single valid record 18', () => {
        expect(coerce('005B0000003g6BCIAY')).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return array when passed an array of valid record 18s', () => {
        expect(coerce(['005B0000003g6BCIAY'])).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return sorted array when passed an array of multiple valid record 18s', () => {
        expect(coerce(['006T1000001rBK9IAM', '005B0000003g6BCIAY'])).toEqual([
            '005B0000003g6BCIAY',
            '006T1000001rBK9IAM',
        ]);
    });

    it('should return array when passed an array of single valid record 15s', () => {
        expect(coerce(['005B0000003g6BC'])).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return array when passed an array of multiple valid record 15s', () => {
        expect(coerce(['005B0000003g6BC', '006T1000001rBK9'])).toEqual([
            '005B0000003g6BCIAY',
            '006T1000001rBK9IAM',
        ]);
    });

    it('should return undefined if a single item in the array is invalid', () => {
        expect(coerce(['005B0000003g6BC', 'invalid'])).toBe(undefined);
    });

    it('should auto-dedupe the array', () => {
        expect(coerce(['005B0000003g6BCIAY', '005B0000003g6BCIAY'])).toEqual([
            '005B0000003g6BCIAY',
        ]);
    });

    it('should auto-dedupe record15 array', () => {
        expect(coerce(['005B0000003g6BC', '005B0000003g6BC'])).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return undefined when passed empty array', () => {
        expect(coerce([])).toEqual(undefined);
    });
});
