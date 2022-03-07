import { setupElement } from 'test-util';
import RelatedListPreferencesBatch from '../lwc/related-list-preferences-batch';

describe('validation', () => {
    ['preferencesIds'].forEach((param) => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                preferencesIds: ['Random'],
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListPreferencesBatch);
            expect(elm.pushCount()).toBe(0);
        });
    });
});
