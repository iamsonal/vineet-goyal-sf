import { factory as getMruListUi } from '../index';
import { GetMruListUiConfig } from '../../../generated/adapters/getMruListUi';

describe('validation', function () {
    it('throws a TypeError if the objectApiName is not defined', () => {
        expect(() => (getMruListUi({} as any) as any)({})).toThrowError(
            'adapter getMruListUi configuration must specify objectApiName'
        );
    });

    it('returns null if objectApiName is an empty string', () => {
        const mockLuvio: any = {
            withContext: (fn: any) => fn,
        };

        const config: GetMruListUiConfig = {
            objectApiName: '',
        };
        expect(getMruListUi(mockLuvio)(config)).toBeNull();
    });
});
