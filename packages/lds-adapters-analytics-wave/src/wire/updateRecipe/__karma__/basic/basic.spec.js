import { updateRecipe } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockUpdateRecipeNetworkOnce,
    mockUpdateRecipeNetworkErrorOnce,
} from 'analytics-wave-test-util';
import GetRecipe from '../../../getRecipe/__karma__/lwc/get-recipe';

const MOCK_PREFIX = 'wire/updateRecipe/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('update recipe name and label', async () => {
        const mock = getMock('recipe1');
        const config = {
            id: mock.id,
            recipeObject: {
                name: 'new_name',
                label: 'new_label',
            },
        };
        mockUpdateRecipeNetworkOnce(config, mock);

        const data = await updateRecipe(config);

        expect(data).toEqual(mock);
    });

    it('update recipe license', async () => {
        const mock = getMock('recipe2');
        const config = {
            id: mock.id,
            recipeObject: {
                licenseAttributes: {
                    type: 'sonic',
                },
            },
        };
        mockUpdateRecipeNetworkOnce(config, mock);

        const data = await updateRecipe(config);

        expect(data).toEqual(mock);
    });

    it('update recipe with query params', async () => {
        const mock = getMock('recipe1');
        const config = {
            id: mock.id,
            recipeObject: {
                name: 'new_name',
                label: 'new_label',
            },
            enableEditorValidation: true,
            validationContext: 'editor',
        };
        mockUpdateRecipeNetworkOnce(config, mock);

        const data = await updateRecipe(config);

        expect(data).toEqual(mock);
    });

    it('should not hit the network when another wire tries to access the newly updated recipe', async () => {
        const mock = getMock('recipe2');
        const config = {
            id: mock.id,
            recipeObject: {
                licenseAttributes: {
                    type: 'sonic',
                },
            },
        };
        mockUpdateRecipeNetworkOnce(config, mock);

        const data = await updateRecipe(config);

        const element = await setupElement({ id: data.id }, GetRecipe);

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
            recipeObject: {
                licenseAttributes: {
                    type: 'sonic',
                },
            },
        };
        mockUpdateRecipeNetworkErrorOnce(config, mock);

        try {
            await updateRecipe(config);
            // make sure we are hitting the catch
            fail('updateRecipe did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
            expect(e).toBeImmutable();
        }
    });
});
