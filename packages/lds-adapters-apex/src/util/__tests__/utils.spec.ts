import { getFieldApiName, splitQualifiedFieldApiName } from '../utils';

describe('getFieldApiName', () => {
    it('returns fieldApiName on valid input', () => {
        expect(getFieldApiName('FieldName')).toBe('FieldName');
        expect(getFieldApiName({ objectApiName: 'Account', fieldApiName: 'FieldName' })).toBe(
            'Account.FieldName'
        );
    });
});

describe('splitQualifiedFieldApiName', () => {
    it('returns fieldApiName on valid input', () => {
        expect(splitQualifiedFieldApiName('Object.Field')).toEqual(['Object', 'Field']);
        expect(splitQualifiedFieldApiName('Object.Field.Other')).toEqual(['Object', 'Field.Other']);
    });

    it('throws an error on invalid input', () => {
        expect((): void => {
            splitQualifiedFieldApiName('Object');
        }).toThrow('Value does not include an object API name.');
    });
});
