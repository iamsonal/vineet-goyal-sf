import { factory as getLayout } from '../index';

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

describe('factory', () => {
    it('throws an error if layoutType is not present', () => {
        const config = {
            objectApiName: 'Account',
            mode: 'View',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        expect(() => getLayout({} as any)(config)).toThrowError(
            'adapter getLayout configuration must specify layoutType, mode, objectApiName'
        );
    });

    it('throws an error if mode is not present', () => {
        const config = {
            objectApiName: 'Account',
            layoutType: 'Full',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        expect(() => getLayout({} as any)(config)).toThrowError(
            'adapter getLayout configuration must specify layoutType, mode, objectApiName'
        );
    });

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('returns null if layoutType is %s', (_type: any, layoutType: any) => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            mode: 'View',
            layoutType,
        };

        expect(getLayout({} as any)(config)).toBeNull();
    });

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('returns null if mode is %s', (_type: any, mode: any) => {
        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
            layoutType: 'Full',
            mode,
        };

        expect(getLayout({} as any)(config)).toBeNull();
    });
});
