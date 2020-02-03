import { factory as getRecordAvatars } from '../index';

describe('validation', () => {
    it('throws a TypeError if the recordId is not defined', () => {
        expect(() => getRecordAvatars({} as any)({} as any)).toThrowError(
            'adapter getRecordAvatars configuration must specify recordIds'
        );
    });
});
