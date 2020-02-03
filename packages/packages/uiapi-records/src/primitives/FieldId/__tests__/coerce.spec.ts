import getFieldApiName from '../coerce';

describe('getFieldApiName', () => {
    it('returns fieldApiName on valid input', () => {
        expect(getFieldApiName('FieldName')).toBe('FieldName');
        expect(getFieldApiName({ objectApiName: 'Account', fieldApiName: 'FieldName' })).toBe(
            'Account.FieldName'
        );
    });

    it('returns undefined on invalid input', () => {
        expect(getFieldApiName(undefined)).toBeUndefined();
        expect(getFieldApiName({})).toBeUndefined();
        expect(getFieldApiName('')).toBeUndefined();
        expect(getFieldApiName({ objectApiName: 'Account' })).toBeUndefined();
        expect(getFieldApiName({ fieldApiName: 'FieldName' })).toBeUndefined();
    });
});
