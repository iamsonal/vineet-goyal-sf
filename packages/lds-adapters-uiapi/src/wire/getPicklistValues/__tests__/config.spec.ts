import { factory as getPicklistValues } from '../index';

describe('validation', () => {
    it('throws a TypeError if the fieldApiName and recordTypeId is not defined', () => {
        expect(() => getPicklistValues({} as any)({} as any)).toThrowError(
            'adapter getPicklistValues configuration must specify fieldApiName, recordTypeId'
        );
    });

    it('throws a TypeError if the fieldApiName is not defined', () => {
        expect(() => getPicklistValues({ recordTypeId: 'xxx' } as any)({} as any)).toThrowError(
            'adapter getPicklistValues configuration must specify fieldApiName, recordTypeId'
        );
    });

    it('throws a TypeError if the recordTypeId is not defined', () => {
        expect(() => getPicklistValues({ fieldApiName: 'xxx' } as any)({} as any)).toThrowError(
            'adapter getPicklistValues configuration must specify fieldApiName, recordTypeId'
        );
    });

    ['fieldApiName', 'recordTypeId'].forEach((param) => {
        it(`should return null if required param '${param}' is undefined`, () => {
            const config: any = {
                recordTypeId: 'xxx',
                fieldApiName: 'Account.Type',
            };

            config[param] = undefined;
            expect(getPicklistValues({} as any)(config)).toBeNull();
        });

        it(`should return null if required param '${param}' is null`, () => {
            const config: any = {
                recordTypeId: 'xxx',
                fieldApiName: 'Account.Type',
            };

            config[param] = null;
            expect(getPicklistValues({} as any)(config)).toBeNull();
        });
    });
});
