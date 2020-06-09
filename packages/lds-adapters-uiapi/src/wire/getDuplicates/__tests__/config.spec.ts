import { getDuplicatesAdapterFactory as getDuplicates } from '../../../generated/adapters/getDuplicates';

describe('validation', () => {
    it('throws a TypeError if fields is not defined', () => {
        expect(() => (getDuplicates({} as any) as any)({})).toThrowError(
            'adapter getDuplicates configuration must specify fields'
        );
    });

    it('throws for incoercible shape of parameter', () => {
        expect(() => (getDuplicates({} as any) as any)({ apiName: { name: 'foo' } })).toThrowError(
            TypeError
        );
    });
});
