import coerce from './../coerce';

describe('getObjectApiName', () => {
    it('returns objectApiName on valid input', () => {
        expect(coerce('Account')).toBe('Account');
        expect(coerce({ objectApiName: 'Account' })).toBe('Account');
        expect(coerce({ objectApiName: 'Account', fieldApiName: 'FieldName' })).toBe('Account');
    });

    it('returns undefined on invalid input', () => {
        expect(coerce(undefined)).toBeUndefined();
        expect(coerce({})).toBeUndefined();
        expect(coerce('')).toBeUndefined();
        expect(coerce({ objectApiName: undefined })).toBeUndefined();
        expect(coerce({ objectApiName: null })).toBeUndefined();
        expect(coerce({ objectApiName: {} })).toBeUndefined();
    });
});
