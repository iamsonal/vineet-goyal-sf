import { setupElement } from 'test-util';
import ListBasic from '../lwc/list-basic';

describe('validation', () => {
    ['objectApiName', 'listViewApiName'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                objectApiName: 'Account',
                listViewApiName: 'AllAccounts',
            };
            config[param] = undefined;

            const elm = await setupElement(config, ListBasic);
            expect(elm.pushCount()).toBe(0);
        });
    });
});
