import { getObjectInfoAdapterFactory as getObjectInfo } from '../../../generated/adapters/getObjectInfo';

describe('validation', () => {
    it('throws a TypeError if the objectApiName is not defined', () => {
        expect(() => (getObjectInfo({} as any) as any)({})).toThrowError(
            'adapter getObjectInfo configuration must specify objectApiName'
        );
    });

    it('throws for incoercible shape of required parameter', () => {
        expect(() => (getObjectInfo({} as any) as any)({ foo: { bar: 'ok' } })).toThrowError(
            TypeError
        );
    });
});
