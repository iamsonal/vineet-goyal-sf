import { factory as getRecordUi } from '../index';

describe('validation', () => {
    ['recordIds', 'layoutTypes', 'modes'].forEach(param => {
        it(`throws a TypeError if required parameters are not present`, () => {
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

    ['childRelationships', 'pageSize', 'updateMru'].forEach(param => {
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
});
