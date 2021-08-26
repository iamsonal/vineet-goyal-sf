import { getListViewSummaryCollectionAdapterFactory as getListViewSummaryCollection } from '../../../generated/adapters/getListViewSummaryCollection';

describe('validation', () => {
    it('throws a TypeError if the objectApiName is not defined', () => {
        expect(() => (getListViewSummaryCollection({} as any) as any)({})).toThrowError(
            'adapter getListViewSummaryCollection configuration must specify objectApiName'
        );
    });

    it('returns null if objectApiName is an empty string', () => {
        const config: any = {
            objectApiName: '',
        };
        expect(getListViewSummaryCollection({} as any)(config)).toBeNull();
    });
});
