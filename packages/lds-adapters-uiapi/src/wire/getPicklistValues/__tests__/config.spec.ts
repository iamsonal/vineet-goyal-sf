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
});
