import coerce from '../coerce';

describe('LayoutMode coerce', () => {
    it('should return View when passed View', () => {
        expect(coerce('View')).toBe('View');
    });

    it('should return Edit when passed Edit', () => {
        expect(coerce('Edit')).toBe('Edit');
    });

    it('should return Create when passed Create', () => {
        expect(coerce('Create')).toBe('Create');
    });

    it('should return undefined when passed invalid', () => {
        expect(coerce('invalid')).toBe(undefined);
    });
});
