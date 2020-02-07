import GetNavItems from '../lwc/get-nav-items';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetNavItemsNetwork } from 'community-navigation-menu-test-util';

const MOCK_PREFIX = 'wire/getCommunityNavigationMenu/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic navigation menu data', async () => {
        const mock = getMock('menuItems');
        const config = { communityId: 'ABC123' };

        mockGetNavItemsNetwork(config, mock);

        const el = await setupElement(config, GetNavItems);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredNavItems()).toEqual(mock);
    });
});
