import { factory as getRelatedListRecords } from '../index';

describe('get related list records config', () => {
    it('tests no fields returns null', () => {
        const config: any = {
            relatedListId: 'test',
            parentRecordId: 'list',
        };

        expect(getRelatedListRecords({} as any)(config)).toBeNull();
    });
});
