import { updateRecipeNotification } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateRecipeNotificationNetworkOnce,
    mockUpdateRecipeNotificationNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetRecipeNotification from '../../../getRecipeNotification/__karma__/lwc/get-recipe-notification';

const MOCK_PREFIX = 'wire/updateRecipeNotification/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update notification with notification level and long running alert', async () => {
        const mockRecipe = getMock('recipe1');
        const mock = getMock('notification');
        const config = {
            id: mockRecipe.id,
            recipeNotification: mock,
        };
        mockUpdateRecipeNotificationNetworkOnce(config, mock);

        const data = await updateRecipeNotification(config);

        expect(data).toEqual(mock);
    });

    it('update notification with notification level only', async () => {
        const mockRecipe = getMock('recipe1');
        const mock = getMock('notification-level-only');
        const config = {
            id: mockRecipe.id,
            recipeNotification: mock,
        };
        mockUpdateRecipeNotificationNetworkOnce(config, mock);

        const data = await updateRecipeNotification(config);

        expect(data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated notification', async () => {
        const mockRecipe = getMock('recipe1');
        const mock = getMock('notification-level-only');
        const config = {
            id: mockRecipe.id,
            recipeNotification: mock,
        };
        mockUpdateRecipeNotificationNetworkOnce(config, mock);

        const data = await updateRecipeNotification(config);

        const element = await setupElement({ id: data.recipe.id }, GetRecipeNotification);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqual(mock);
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
        const config = {
            id: '05vxx0000004KzQAAU',

            recipeNotification: {
                longRunningAlertInMins: 60,
                notificationLevel: 'always',
            },
        };
        mockUpdateRecipeNotificationNetworkErrorOnce(config, mock);

        try {
            await updateRecipeNotification(config);
            // make sure we are hitting the catch
            fail('updateRecipeNotification did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
            expect(e).toBeImmutable();
        }
    });
});
