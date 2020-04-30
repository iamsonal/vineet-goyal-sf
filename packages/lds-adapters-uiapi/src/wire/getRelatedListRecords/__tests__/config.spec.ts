import { getRelatedListRecordsAdapterFactory as GetRelatedListRecords } from '../../../generated/adapters/getRelatedListRecords';

describe('get related list records config', () => {
    it('tests no config returns null', () => {
        const config = null;

        expect(GetRelatedListRecords({} as any)(config)).toBeNull();
    });
});
