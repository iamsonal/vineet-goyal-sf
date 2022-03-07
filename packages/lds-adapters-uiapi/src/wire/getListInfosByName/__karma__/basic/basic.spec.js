import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetListInfosByNameNetwork, mockGetListInfoByNameNetwork } from 'uiapi-test-util';

import ListInfosComponent from '../lwc/list-infos';
import ListInfoComponent from '../../../getListInfoByName/__karma__/lwc/list-basic';

const MOCK_PREFIX = 'wire/getListInfosByName/__karma__/basic/data/';
const listViewApiNameForSearch = '__SearchResult';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getListInfosByName', () => {
    it('returns data', async () => {
        const mockData = getMock('lists-Account');
        const resourceConfig = {
            names: [`Account.${listViewApiNameForSearch}`],
        };
        mockGetListInfosByNameNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ListInfosComponent);

        const actual = element.getWiredData();
        expect(actual).toBeImmutable();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('returns data in the order provided', async () => {
        const mockData = getMock('lists-Account-Contact');
        const resourceConfig = {
            names: [`Account.${listViewApiNameForSearch}`, `Contact.${listViewApiNameForSearch}`],
        };
        mockGetListInfosByNameNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ListInfosComponent);

        const actual = element.getWiredData();
        expect(actual).toBeImmutable();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('returns data, a mix of errors and 200s, in the order provided', async () => {
        const mockData = getMock('lists-Account-User');
        const resourceConfig = {
            names: [`Account.${listViewApiNameForSearch}`, `User.${listViewApiNameForSearch}`],
        };
        mockGetListInfosByNameNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, ListInfosComponent);

        const actual = element.getWiredData();
        expect(actual).toBeImmutable();
        expect(actual).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should be a cache hit when Account and Contact object infos are loaded separately', async () => {
        const account = getMock('list-Account');
        const mockBatch = getMock('lists-Account-Contact');
        const contact = getMock('list-Contact');

        mockGetListInfoByNameNetwork(
            {
                listViewApiName: listViewApiNameForSearch,
                objectApiName: 'Account',
            },
            account
        );

        mockGetListInfoByNameNetwork(
            {
                listViewApiName: listViewApiNameForSearch,
                objectApiName: 'Contact',
            },
            contact
        );

        await setupElement(
            {
                listViewApiName: listViewApiNameForSearch,
                objectApiName: 'Account',
            },
            ListInfoComponent
        );

        await setupElement(
            {
                listViewApiName: listViewApiNameForSearch,
                objectApiName: 'Contact',
            },
            ListInfoComponent
        );

        const batch = await setupElement(
            {
                names: [
                    `Account.${listViewApiNameForSearch}`,
                    `Contact.${listViewApiNameForSearch}`,
                ],
            },
            ListInfosComponent
        );

        expect(batch.getWiredData()).toEqualSnapshotWithoutEtags(mockBatch);
    });

    it('should refresh data', async () => {
        const mockData = getMock('lists-Account-Contact');
        const refreshData = getMock('lists-Account-Contact');
        const accountListInfo = refreshData.results[0].result;
        accountListInfo.eTag = accountListInfo.eTag + '888';
        accountListInfo.cloneable = true;

        const resourceConfig = {
            names: [`Account.${listViewApiNameForSearch}`, `Contact.${listViewApiNameForSearch}`],
        };
        mockGetListInfosByNameNetwork(resourceConfig, [mockData, refreshData]);

        const comp = await setupElement(resourceConfig, ListInfosComponent);
        expect(comp.pushCount()).toBe(1);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await comp.refresh();

        expect(comp.pushCount()).toBe(2);
        expect(comp.getWiredData()).toEqualSnapshotWithoutEtags(refreshData);
    });
});
