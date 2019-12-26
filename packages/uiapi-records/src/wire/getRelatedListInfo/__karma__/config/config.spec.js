import { setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID } from 'uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

describe('validation', () => {
    ['parentObjectApiName', 'recordTypeId', 'relatedListId'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentObjectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
                relatedListId: 'CObjChilds__r',
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListBasic);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it(`should not make an HTTP request if recordTypeId is null`, async () => {
        const config = {
            parentObjectApiName: 'Account',
            recordTypeId: null,
            relatedListId: 'CObjChilds__r',
        };

        const elm = await setupElement(config, RelatedListBasic);
        expect(elm.pushCount()).toBe(0);
    });
});
