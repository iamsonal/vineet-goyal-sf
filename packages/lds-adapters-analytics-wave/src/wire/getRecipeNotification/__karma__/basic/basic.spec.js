import GetRecipeNotification from '../lwc/get-recipe-notification';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRecipeNotificationNetworkOnce,
    mockGetRecipeNotificationNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getRecipeNotification/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets recipe notification', async () => {
        const mock = getMock('notification');
        const recipeMock = getMock('recipe');
        const config = { id: recipeMock.id };
        mockGetRecipeNotificationNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipeNotification);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets notification with notification level only', async () => {
        const mock = getMock('notification-level-only');
        const recipeMock = getMock('recipe');
        const config = { id: recipeMock.id };
        mockGetRecipeNotificationNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipeNotification);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('notification');
        const recipeMock = getMock('recipe');
        const config = { id: recipeMock.id };
        mockGetRecipeNotificationNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipeNotification);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetRecipeNotification);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
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
        const config = { id: '05vRM00000003rZYAQ' };
        mockGetRecipeNotificationNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetRecipeNotification);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
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
        const config = { id: '05vRM0000000324YAB' };

        mockGetRecipeNotificationNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetRecipeNotification);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement(config, GetRecipeNotification);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('notification');
        const recipeMock = getMock('recipe');
        const config = { id: recipeMock.id };
        mockGetRecipeNotificationNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetRecipeNotification);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetRecipeNotification);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('notification');
        const updatedData = getMock('notification-2');
        const recipeMock = getMock('recipe');
        const config = { id: recipeMock.id };
        mockGetRecipeNotificationNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetRecipeNotification);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetRecipeNotification);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
