import { factory as getListUiByListViewId, validateGetListUiConfig } from '../index';
import { GetListUiByListViewIdConfig } from '../../../generated/adapters/getListUiByListViewId';

describe('validation', () => {
    it('returns null if the listViewId is not defined', () => {
        const mockLuvio: any = {
            withContext: (fn: any) => fn,
        };

        expect((getListUiByListViewId(mockLuvio) as any)({})).toBeNull();
    });

    it('returns null if listViewId is an empty string', () => {
        const mockLuvio: any = {
            withContext: (fn: any) => fn,
        };

        const configUsingListViewId: GetListUiByListViewIdConfig = {
            listViewId: '',
        };

        expect(getListUiByListViewId(mockLuvio)(configUsingListViewId)).toBeNull();
    });

    it('validates config with ObjectId', () => {
        const configUsingApiName = {
            listViewApiName: 'AllAccounts',
            objectApiName: {
                objectApiName: 'Account',
            },
        };

        const expectedConfig = {
            listViewApiName: 'AllAccounts',
            objectApiName: 'Account',
        };

        const returnedConfig = validateGetListUiConfig(configUsingApiName);
        expect(returnedConfig).toStrictEqual(expectedConfig);
    });
});
