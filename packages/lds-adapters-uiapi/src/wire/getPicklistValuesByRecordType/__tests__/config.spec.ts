import { getPicklistValuesByRecordTypeAdapterFactory as getPicklistValuesByRecordType } from '../../../generated/adapters/getPicklistValuesByRecordType';

describe('validation', function () {
    it('throws a TypeError if the objectApiName and recordTypeId is not defined', () => {
        expect(() => getPicklistValuesByRecordType({} as any)({} as any)).toThrowError(
            'adapter getPicklistValuesByRecordType configuration must specify objectApiName, recordTypeId'
        );
    });

    ['objectApiName', 'recordTypeId'].forEach((param) => {
        it(`should return null if required param '${param}' is undefined`, () => {
            const config: any = {
                objectApiName: 'Account',
                recordTypeId: 'xxx',
            };

            config[param] = undefined;
            expect(getPicklistValuesByRecordType({} as any)(config)).toBeNull();
        });

        it(`should return null if required param '${param}' is null`, () => {
            const config: any = {
                objectApiName: 'Account',
                recordTypeId: 'xxx',
            };

            config[param] = null;
            expect(getPicklistValuesByRecordType({} as any)(config)).toBeNull();
        });
    });
});
