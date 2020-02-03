import coerce from '../coerce';

describe('LayoutType coerce', () => {
    it('should return Full when passed Full', () => {
        expect(coerce('Full')).toBe('Full');
    });

    it('should return Compact when passed Compact', () => {
        expect(coerce('Compact')).toBe('Compact');
    });

    it('should return undefined when passed invalid', () => {
        expect(coerce('invalid')).toBe(undefined);
    });
});
