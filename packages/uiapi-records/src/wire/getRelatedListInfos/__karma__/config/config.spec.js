import { setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID } from 'uiapi-test-util';
import RelatedListInfos from '../lwc/related-list-infos';

describe('validation', () => {
    ['parentObjectApiName', 'recordTypeId'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is undefined`, async () => {
            const config = {
                parentObjectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = undefined;

            const elm = await setupElement(config, RelatedListInfos);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it(`should not make an HTTP request if recordTypeId is null`, async () => {
        const config = {
            parentObjectApiName: 'Account',
            recordTypeId: null,
        };

        const elm = await setupElement(config, RelatedListInfos);
        expect(elm.pushCount()).toBe(0);
    });
});
