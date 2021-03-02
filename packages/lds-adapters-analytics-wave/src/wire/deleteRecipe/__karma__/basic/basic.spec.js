import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    URL_BASE,
    mockDeleteRecipeNetworkOnce,
    mockGetRecipeNetworkOnce,
} from 'analytics-wave-test-util';
import { deleteRecipe } from 'lds-adapters-analytics-wave';
import { karmaNetworkAdapter } from 'lds-engine';
import GetRecipe from '../../../getRecipe/__karma__/lwc/get-recipe';

const MOCK_PREFIX = 'wire/deleteRecipe/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteRecipe - basic', () => {
    it('sends request with the given recipe ID', async () => {
        const mock = getMock('recipe');
        const config = {
            id: mock.id,
        };
        mockDeleteRecipeNetworkOnce(config);
        await deleteRecipe(config);
        const expected = {
            basePath: `${URL_BASE}/recipes/${mock.id}`,
            method: 'delete',
            urlParams: { id: mock.id },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts recipe from cache', async () => {
        const mockRecipe = getMock('recipe');
        const mockError = getMock('delete-recipe-not-exist');
        const config = {
            id: mockRecipe.id,
        };

        // First GET call should retrieve successfully. Second GET call should return not found.
        mockGetRecipeNetworkOnce(config, [
            mockRecipe,
            {
                reject: true,
                status: 404,
                data: mockError,
            },
        ]);
        mockDeleteRecipeNetworkOnce(config);

        // First successful GET call will populate the cache
        const el = await setupElement(config, GetRecipe);

        await deleteRecipe(config);
        // The existing GET wire will be refreshed
        await flushPromises();

        expect(el.pushCount()).toBe(2);
        expect(el.getWiredError()).toEqual(mockError);
        expect(el.getWiredError()).toBeImmutable();
    });
});

describe('deleteRecipe - errors', () => {
    it('rejects when server returns an error', async () => {
        const mockError = getMock('delete-recipe-error');
        const config = {
            id: "05vRM00000003rZYAQ'",
        };

        mockDeleteRecipeNetworkOnce(config, { reject: true, data: mockError });

        let error;
        try {
            await deleteRecipe(config);
            fail("deleteRecipe should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorResponse(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mockRecipe = getMock('recipe');
        const mockError = getMock('delete-recipe-error');
        const config = {
            id: mockRecipe.id,
        };

        mockGetRecipeNetworkOnce(config, mockRecipe);
        mockDeleteRecipeNetworkOnce(config, { reject: true, data: mockError });

        // GET call will populate the cache
        await setupElement(config, GetRecipe);
        try {
            await deleteRecipe(config);
            fail('deleteRecipe should have thrown an error');
        } catch (e) {
            // Delete recipe fails
        }

        // Assert that the recipe is still in the cache
        const element = await setupElement(config, GetRecipe);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecipe);
    });
});
