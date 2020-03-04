import GetNavItems from '../lwc/get-nav-items';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetNavItemsNetworkOnce,
    mockGetNavItemsNetworkErrorOnce,
} from 'community-navigation-menu-test-util';

const MOCK_PREFIX = 'wire/getCommunityNavigationMenu/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic navigation menu data', async () => {
        const mock = getMock('menuItems');
        const config = { communityId: 'ABC123' };
        mockGetNavItemsNetworkOnce(config, mock);

        const el = await setupElement(config, GetNavItems);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredNavItems()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('menuItems');
        const config = { communityId: 'ABC123' };
        mockGetNavItemsNetworkOnce(config, mock);

        const el = await setupElement(config, GetNavItems);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredNavItems()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetNavItems);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredNavItems()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { communityId: 'ABC123' };
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockGetNavItemsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetNavItems);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
