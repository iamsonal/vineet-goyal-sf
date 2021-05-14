import { setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID } from 'uiapi-test-util';
import GetPicklistValuesByRecordType from '../lwc/get-picklist-values-by-record-type';

describe('validation', () => {
    ['objectApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param '${param}' is undefined`, async () => {
            const config = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = undefined;

            const element = await setupElement(config, GetPicklistValuesByRecordType);
            expect(element.pushCount()).toBe(0);
        });
    });

    ['objectApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param '${param}' is null`, async () => {
            const config = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = null;

            const element = await setupElement(config, GetPicklistValuesByRecordType);
            expect(element.pushCount()).toBe(0);
        });
    });
});
