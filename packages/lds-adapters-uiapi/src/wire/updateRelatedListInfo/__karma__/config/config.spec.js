import { setupElement } from 'test-util';

import RelatedListBasic from '../../../getRelatedListInfo/__karma__/lwc/related-list-basic';

describe('validation', () => {
    ['parentObjectApiName', 'relatedListId'].forEach((param) => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentObjectApiName: 'Account',
                relatedListId: 'CObjChilds__r',
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListBasic);
            expect(elm.pushCount()).toBe(0);
        });
    });
});
