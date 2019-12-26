import { coerceConfigWithDefaults } from '../index';

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

describe('coercion', () => {
    it('coerces layoutType and mode to default if they are not present', () => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        expect(coerceConfigWithDefaults(config)).toEqual({
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: 'Full',
            mode: 'View',
        });
    });

    it('coerces layoutType and mode to default if they are undefined', () => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: undefined,
            mode: undefined,
        };

        expect(coerceConfigWithDefaults(config)).toEqual({
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: 'Full',
            mode: 'View',
        });
    });

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('returns null if layoutType is %s', (_type: any, layoutType: any) => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType,
        };

        expect(coerceConfigWithDefaults(config)).toBeNull();
    });

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('returns null if mode is %s', (_type: any, mode: any) => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            mode,
        };

        expect(coerceConfigWithDefaults(config)).toBeNull();
    });

    it('returns same layout and mode value if they are valid', () => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: 'Compact',
            mode: 'Create',
        };

        expect(coerceConfigWithDefaults(config)).toEqual({
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: 'Compact',
            mode: 'Create',
        });
    });
});
