import GetRecipe from '../lwc/get-recipe';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRecipeNetworkOnce,
    mockGetRecipeNetworkErrorOnce,
    expireAsset,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getRecipe/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets recipe', async () => {
        const mock = getMock('recipe');
        const config = { id: mock.id };
        mockGetRecipeNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipe);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets r3 recipe', async () => {
        const mock = getMock('recipe-r3');
        const config = { id: mock.id, format: 'R3' };
        mockGetRecipeNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id, format: 'R3' }, GetRecipe);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets r3 recipe with status', async () => {
        const mock = getMock('recipe-r3-status');
        const config = { id: mock.id, format: 'R3' };
        mockGetRecipeNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id, format: 'R3' }, GetRecipe);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('recipe');
        const config = { id: mock.id };
        mockGetRecipeNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipe);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetRecipe);
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
        mockGetRecipeNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetRecipe);
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

        mockGetRecipeNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetRecipe);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement(config, GetRecipe);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('recipe-r3');
        const config = { id: mock.id };
        mockGetRecipeNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetRecipe);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetRecipe);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('recipe-r3');
        const updatedData = getMock('recipe-r3-2');
        const config = { id: mock.id };
        mockGetRecipeNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetRecipe);

        // expire cache
        expireAsset();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetRecipe);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
