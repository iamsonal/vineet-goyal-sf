import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireNavItems, mockGetNavItemsNetwork } from 'uiapi-test-util';

import NavItemsBasic from '../lwc/nav-items';

const MOCK_PREFIX = 'wire/getNavItems/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getNavItems - fetch errors', () => {
    it('should emit network error to component', async () => {
        const mockError = getMock('nav-items-error');

        const config = { navItemNames: ['notExisted'] };
        mockGetNavItemsNetwork(config, { reject: true, data: mockError });

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toBeUndefined();
        expect(element.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should resolve with correct data when an error is refreshed', async () => {
        const mock = getMock('nav-items-small-ff');
        const mockError = getMock('nav-items-error');

        const config = { formFactor: 'Small' };
        mockGetNavItemsNetwork(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        const refreshed = await element.refresh();

        expect(refreshed).toBeUndefined();
    });

    it('should reject when refresh results in an error', async () => {
        const mock = getMock('nav-items-small-ff');
        const mockError = getMock('nav-items-error');

        const config = { formFactor: 'Small' };
        mockGetNavItemsNetwork(config, [
            mock,
            {
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);

        try {
            await element.refresh();
            fail();
        } catch (e) {
            expect(e).toContainErrorResponse(mockError);
        }
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('nav-items-error');

        const config = { formFactor: 'Small' };
        mockGetNavItemsNetwork(config, {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        });

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        const elementB = await setupElement(config, NavItemsBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should not emit when refetching nav items returns the same error after ingested error TTLs out', async () => {
        const mockError = getMock('nav-items-error');

        const config = { formFactor: 'Small' };
        mockGetNavItemsNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireNavItems();

        const elementB = await setupElement(config, NavItemsBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);

        // First element should not have received new error
        expect(element.pushCount()).toBe(1);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('nav-items-small-ff');
        const mockError = getMock('nav-items-error');

        const config = { formFactor: 'Small' };
        mockGetNavItemsNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, NavItemsBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireNavItems();

        const elementB = await setupElement(config, NavItemsBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualNavItemsSnapShot(mock);
    });
});
