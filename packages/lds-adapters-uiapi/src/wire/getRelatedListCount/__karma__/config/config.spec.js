import { setupElement } from 'test-util';
import RelatedListCount from '../lwc/related-list-count';

describe('validation', () => {
    ['parentRecordId', 'relatedListId'].forEach((param) => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentRecordId: '00BT1000000NUvCMAW',
                relatedListId: 'someName',
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListCount);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it(`should not make an HTTP request if relatedList name is null`, async () => {
        const config = {
            parentRecordId: '00BT1000000NUvCMAW',
            relatedListId: null,
        };

        const elm = await setupElement(config, RelatedListCount);
        expect(elm.pushCount()).toBe(0);
    });
});
