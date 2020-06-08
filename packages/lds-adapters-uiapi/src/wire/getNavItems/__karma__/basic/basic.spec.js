import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireNavItems, mockGetNavItemsNetwork } from 'uiapi-test-util';

import NavItems from '../lwc/nav-items';

const MOCK_PREFIX = 'wire/getNavItems/__karma__/basic/data/';
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('nav-items-small-ff');
        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, mockData);

        const element = await setupElement(config, NavItems);

        expect(element.getWiredData()).toEqualNavItemsSnapShot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('nav-items-small-ff');
        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, mockData);

        // populate cache
        await setupElement(config, NavItems);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, NavItems);

        expect(element.getWiredData()).toEqualNavItemsSnapShot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('nav-items-small-ff');
        const updatedData = getMock('nav-items-small-ff-updated');

        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, NavItems);

        // expire cache
        expireNavItems();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, NavItems);

        expect(element.getWiredData()).toEqualNavItemsSnapShot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('nav-items-small-ff');
        const updatedData = getMock('nav-items-small-ff-updated');

        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, NavItems);
        expireNavItems();

        // fetches updated data from network
        await setupElement(config, NavItems);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualNavItemsSnapShot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('nav-items-small-ff');
        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, NavItems);
        expireNavItems();

        // fetches updated data from network
        await setupElement(config, NavItems);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualNavItemsSnapShot(mockData);
    });

    it('should not emit data to wire with different ff', async () => {
        const mockData = getMock('nav-items-small-ff');

        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData]);

        const largeffMockData = getMock('nav-items-large-ff');
        const largeffConfig = {
            formFactor: 'Large',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(largeffConfig, largeffMockData);

        const wireA = await setupElement(config, NavItems);
        expect(wireA.getWiredData()).toEqualNavItemsSnapShot(mockData);

        const wireB = await setupElement(largeffConfig, NavItems);
        expect(wireB.getWiredData()).toEqualNavItemsSnapShot(largeffMockData);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualNavItemsSnapShot(mockData);
    });

    it('should not emit data to wire with different navItemNames', async () => {
        const mockData = getMock('nav-items-large-ff');

        const config = {
            formFactor: 'Large',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData]);

        const navItemNamesMockData = getMock('nav-itemNames-large-ff');
        const navItemNamesconfig = {
            formFactor: 'Large',
            navItemNames: ['items3'],
        };
        mockGetNavItemsNetwork(navItemNamesconfig, navItemNamesMockData);

        const wireA = await setupElement(config, NavItems);
        expect(wireA.getWiredData()).toEqualNavItemsSnapShot(mockData);

        const wireB = await setupElement(navItemNamesconfig, NavItems);
        expect(wireB.getWiredData()).toEqualNavItemsSnapShot(navItemNamesMockData);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualNavItemsSnapShot(mockData);
    });
});

describe('refresh', () => {
    it('refreshes with up-to-date data', async () => {
        const mockData = getMock('nav-items-small-ff');

        const refreshMockData = getMock('nav-items-small-ff-updated');

        const config = {
            formFactor: 'Small',
            navItemNames: ['items1', 'item2'],
        };
        mockGetNavItemsNetwork(config, [mockData, refreshMockData]);

        const element = await setupElement(config, NavItems);
        expect(element.getWiredData()).toEqualNavItemsSnapShot(mockData);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualNavItemsSnapShot(refreshMockData);
    });
});
