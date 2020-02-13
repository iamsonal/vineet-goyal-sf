import { factory as getRecord } from '../index';

describe('validation', () => {
    it('throws a TypeError if the recordId is not defined', () => {
        expect(() => getRecord({} as any)({} as any)).toThrowError(
            'adapter getRecord configuration must specify recordId'
        );
    });

    it('throws a TypeError if none of the oneOf required fields is not present', () => {
        expect(() => getRecord({} as any)({ recordId: '005B0000003g6BCIAY' } as any)).toThrowError(
            'adapter getRecord configuration must specify one of fields, layoutTypes, optionalFields'
        );
    });

    it('returns null if the only oneOf required field is coerced to undefined', () => {
        expect(
            getRecord({} as any)({ recordId: '005B0000003g6BCIAY', fields: [] } as any)
        ).toBeNull();
    });

    ['childRelationships', 'pageSize', 'updateMru'].forEach(prop => {
        it(`throws a TypeError when passing ${prop}`, () => {
            expect(() =>
                getRecord({} as any)({
                    recordId: '005B0000003g6BCIAY',
                    fields: ['Opportunity.Name'],
                    [prop]: true,
                } as any)
            ).toThrowError(
                'adapter getRecord does not yet support childRelationships, pageSize, updateMru'
            );
        });
    });
});
