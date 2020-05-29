import { setupElement } from 'test-util';
import RelatedListsCount from '../lwc/related-lists-count';

describe('validation', () => {
    ['parentRecordId', 'relatedListNames'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentRecordId: 'a00RM0000004aVwYAI',
                relatedListNames: ['CwcCustom01s__r'],
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListsCount);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it(`should not make an HTTP request if relatedList names is null`, async () => {
        const config = {
            parentRecordId: 'a00RM0000004aVwYAI',
            relatedListNames: null,
        };

        const elm = await setupElement(config, RelatedListsCount);
        expect(elm.pushCount()).toBe(0);
    });

    it(`should not make an HTTP request if if relatedList names is length 0`, async () => {
        const config = {
            parentRecordId: 'a00RM0000004aVwYAI',
            relatedListNames: [],
        };

        const elm = await setupElement(config, RelatedListsCount);
        expect(elm.pushCount()).toBe(0);
    });
});
