import { setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID } from 'uiapi-test-util';
import GetPicklistValues from '../lwc/get-picklist-values';

describe('validation', () => {
    ['fieldApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param '${param}' is undefined`, async () => {
            const config = {
                fieldApiName: 'Account.Type',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = undefined;

            const element = await setupElement(config, GetPicklistValues);
            expect(element.pushCount()).toBe(0);
        });
    });

    ['fieldApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param '${param}' is null`, async () => {
            const config = {
                fieldApiName: 'Account.Type',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = null;

            const element = await setupElement(config, GetPicklistValues);
            expect(element.pushCount()).toBe(0);
        });
    });
});
