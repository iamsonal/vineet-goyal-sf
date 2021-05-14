import { factory as getRecordUi } from '../index';

describe('validation', () => {
    ['recordIds', 'layoutTypes', 'modes'].forEach((param) => {
        it(`throws a TypeError if required parameter ${param} is not present`, () => {
            const config: any = {
                recordIds: '005B0000003g6BCIAY',
                layoutTypes: ['Full'],
                modes: ['view'],
            };
            delete config[param];

            expect(() => getRecordUi({} as any)(config)).toThrowError(
                'adapter getRecordUi configuration must specify layoutTypes, modes, recordIds'
            );
        });
    });

    ['childRelationships', 'pageSize', 'updateMru'].forEach((param) => {
        it(`throws a TypeError when passing unsupported parameter ${param}`, () => {
            const config: any = {
                recordIds: '005B0000003g6BCIAY',
                layoutTypes: ['Full'],
                modes: ['view'],
            };
            config[param] = true;

            expect(() => getRecordUi({} as any)(config)).toThrowError(
                'adapter getRecordUi does not yet support childRelationships, formFactor, pageSize, updateMru'
            );
        });
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['an empty array', []],
        ['a non-15/18 length string', 'invalid'],
        ['an array with non-15/18 length string', ['invalid']],
        ['an array with valid and non-15/18 length strings', ['005B0000003g6BCIAY', 'invalid']],
    ])('returns null if recordIds is %s', (_type: any, value: any) => {
        const config: any = {
            recordIds: value,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        expect(getRecordUi({} as any)(config)).toBeNull();
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['an empty array', []],
    ])('returns null if layoutTypes is %s', (_type: any, value: any) => {
        const config: any = {
            recordIds: ['005B0000003g6BCIAY'],
            modes: ['view'],
            layoutTypes: value,
        };
        expect(getRecordUi({} as any)(config)).toBeNull();
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['an empty array', []],
    ])('returns null if modes is %s', (_type: any, value: any) => {
        const config: any = {
            recordIds: ['005B0000003g6BCIAY'],
            layoutTypes: ['Full'],
            modes: value,
        };
        expect(getRecordUi({} as any)(config)).toBeNull();
    });
});
