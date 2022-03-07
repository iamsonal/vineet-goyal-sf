import { setupElement } from 'test-util';
import RelatedListPreferences from '../lwc/related-list-preferences';

describe('validation', () => {
    ['preferencesId'].forEach((param) => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                preferencesId: 'Random',
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListPreferences);
            expect(elm.pushCount()).toBe(0);
        });
    });
});
