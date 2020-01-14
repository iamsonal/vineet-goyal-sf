import { factory as getRelatedListRecords } from '../index';

describe('get related list records config', () => {
    it('tests no config returns null', () => {
        const config = null;

        expect(getRelatedListRecords({} as any)(config)).toBeNull();
    });
});
