import { setupElement } from 'test-util';
import RelatedListInfoBatch from '../lwc/related-list-info-batch';

describe('validation', () => {
    ['parentObjectApiName', 'relatedListNames'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentObjectApiName: 'Custom__c',
                relatedListNames: ['CwcCustom01s__r'],
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListInfoBatch);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it(`should not make an HTTP request if relatedList names is null`, async () => {
        const config = {
            parentObjectApiName: 'Custom__c',
            relatedListNames: null,
        };

        const elm = await setupElement(config, RelatedListInfoBatch);
        expect(elm.pushCount()).toBe(0);
    });
});
