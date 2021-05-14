import { setupElement } from 'test-util';
import RelatedListsInfo from '../lwc/related-lists-info';

describe('validation', () => {
    ['parentObjectApiName'].forEach((param) => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentObjectApiName: 'Account',
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListsInfo);
            expect(elm.pushCount()).toBe(0);
        });
    });
});
