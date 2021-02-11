import GetRecipes from '../lwc/get-recipes';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRecipesNetworkOnce,
    mockGetRecipesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getRecipes/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets recipes', async () => {
        const mock = getMock('recipes');
        const config = {};
        mockGetRecipesNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets r3 recipes', async () => {
        const mock = getMock('recipes-r3');
        const config = { format: 'R3' };
        mockGetRecipesNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets recipes with search and sort', async () => {
        const mock = getMock('recipes-by-name');
        const config = { q: 'r3y', sort: 'Name' };
        mockGetRecipesNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets recipes with licenseType, page, and pageSize', async () => {
        const mock = getMock('recipes-by-page');
        const config = { licenseType: 'Sonic', page: 'eyJwYWdlU2', pageSize: 20 };
        mockGetRecipesNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('recipes');
        const config = {};
        mockGetRecipesNetworkOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetRecipes);
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
        const config = {};
        mockGetRecipesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetRecipes);
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
        const config = {};
        mockGetRecipesNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetRecipes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetRecipes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
