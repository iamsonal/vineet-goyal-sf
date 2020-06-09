import { getDuplicateConfigurationAdapterFactory as getDuplicateConfiguration } from '../../../generated/adapters/getDuplicateConfiguration';

describe('validation', () => {
    it('throws a TypeError if the objectApiName is not defined', () => {
        expect(() => (getDuplicateConfiguration({} as any) as any)({})).toThrowError(
            'adapter getDuplicateConfiguration configuration must specify objectApiName'
        );
    });

    it('throws for incoercible shape of required parameter', () => {
        expect(() =>
            (getDuplicateConfiguration({} as any) as any)({ foo: { bar: 'ok' } })
        ).toThrowError(TypeError);
    });
});
